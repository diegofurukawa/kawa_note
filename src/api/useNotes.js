import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from './client';
import { getKey } from '@/lib/keyManager';
import { encrypt, decrypt, encryptJSON, decryptJSON } from '@/lib/crypto';
import { handleEncryptionError, checkAndHandleEncryptionError } from '@/lib/errorHandlers';

/** @typedef {import('@/types/models').Note} Note */
/** @typedef {import('@/types/api').ApiSuccessResponse} ApiSuccessResponse */

const NOTES_QUERY_KEY = 'notes';

// Module-level flag to prevent multiple logout triggers
let encryptionLogoutTriggered = false;

/**
 * Reset encryption logout flag (called on successful login)
 */
export function resetEncryptionLogoutFlag() {
  encryptionLogoutTriggered = false;
}

/**
 * Encrypt note fields before sending to API
 * @param {Partial<Note>} noteData - Note data to encrypt
 * @returns {Promise<Partial<Note>>} Encrypted note data
 */
async function encryptNoteData(noteData) {
  console.log('🔐 encryptNoteData: Starting encryption...');
  const key = await getKey();
  if (!key) {
    console.error('❌ encryptNoteData: Encryption key not available!');
    handleEncryptionError();
    throw new Error('Encryption key not available. Please log in again.');
  }

  console.log('✅ encryptNoteData: Encryption key available');
  const encrypted = { ...noteData, isEncrypted: true };

  if (noteData.title) {
    encrypted.title = await encrypt(noteData.title, key);
  }
  if (noteData.content) {
    encrypted.content = await encrypt(noteData.content, key);
  }
  if (noteData.context) {
    encrypted.context = await encrypt(noteData.context, key);
  }
  if (noteData.previewData) {
    encrypted.previewData = await encryptJSON(noteData.previewData, key);
  }
  if (noteData.tags && Array.isArray(noteData.tags)) {
    // Tags: encrypt as JSON string
    encrypted.tags = await encryptJSON(noteData.tags, key);
  }

  console.log('✅ encryptNoteData: Encryption completed');
  return encrypted;
}

/**
 * Decrypt note fields after receiving from API
 * @param {Note} note - Encrypted note
 * @returns {Promise<Note>} Decrypted note
 */
async function decryptNoteData(note) {
  if (!note.isEncrypted) {
    // Legacy plaintext note - return as-is but ensure tags is array
    return {
      ...note,
      tags: Array.isArray(note.tags) ? note.tags : []
    };
  }

  const key = await getKey();
  if (!key) {
    // Key not available - trigger logout ONCE
    console.warn('Encryption key not available. Cannot decrypt note:', note.id);
    
    if (!encryptionLogoutTriggered) {
      encryptionLogoutTriggered = true;
      // Trigger logout with encryption error
      const error = new Error('Encryption key not available. Please log in again.');
      checkAndHandleEncryptionError(error);
    }
    
    return {
      ...note,
      title: '[Encrypted - Login Required]',
      content: '[Encrypted content - Please log in to view]',
      tags: []
    };
  }

  try {
    const decrypted = { ...note };

    if (note.title) {
      decrypted.title = await decrypt(note.title, key);
    }
    if (note.content) {
      decrypted.content = await decrypt(note.content, key);
    }
    if (note.context) {
      decrypted.context = await decrypt(note.context, key);
    }
    if (note.previewData) {
      decrypted.previewData = await decryptJSON(note.previewData, key);
    }
    if (note.tags) {
      // Tags stored as encrypted JSON string
      const decryptedTags = await decryptJSON(note.tags, key);
      decrypted.tags = Array.isArray(decryptedTags) ? decryptedTags : [];
    } else {
      decrypted.tags = [];
    }

    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt note:', note.id, error);
    return {
      ...note,
      title: '[Decryption Failed]',
      content: '[Unable to decrypt content - Data may be corrupted]',
      tags: []
    };
  }
}

/**
 * Hook to fetch notes list with optional filters
 * @param {Object} filters - Filter options
 * @returns {import('@tanstack/react-query').UseQueryResult<ApiSuccessResponse<Note[]>>}
 */
export const useNotes = (filters = {}) => {
  return useQuery({
    queryKey: [NOTES_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await notesApi.list(filters);
      
      // Decrypt all notes
      if (response.data && Array.isArray(response.data)) {
        response.data = await Promise.all(
          response.data.map(note => decryptNoteData(note))
        );
      }
      
      return response;
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

/**
 * Hook to fetch a single note by ID
 * @param {string} id - Note ID
 * @returns {import('@tanstack/react-query').UseQueryResult<ApiSuccessResponse<Note>>}
 */
export const useNote = (id) => {
  return useQuery({
    queryKey: [NOTES_QUERY_KEY, id],
    queryFn: async () => {
      const response = await notesApi.get(id);
      
      // Decrypt note
      if (response.data) {
        response.data = await decryptNoteData(response.data);
      }
      
      return response;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5
  });
};

/**
 * Hook to create a new note
 * @returns {import('@tanstack/react-query').UseMutationResult<ApiSuccessResponse<Note>, Error, Note>}
 */
export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteData) => {
      // Encrypt before sending
      const encrypted = await encryptNoteData(noteData);
      return notesApi.create(encrypted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY] });
    }
  });
};

/**
 * Hook to update an existing note
 * @returns {import('@tanstack/react-query').UseMutationResult<ApiSuccessResponse<Note>, Error, {id: string, data: Partial<Note>}>}
 */
export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Encrypt fields that are being updated
      const encrypted = await encryptNoteData(data);
      return notesApi.update(id, encrypted);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY] });
    }
  });
};

/**
 * Hook to delete a note
 * @returns {import('@tanstack/react-query').UseMutationResult<ApiSuccessResponse<void>, Error, string>}
 */
export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY] });
    }
  });
};

/**
 * Hook to search notes
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<ApiSuccessResponse<Note[]>>}
 */
export const useSearchNotes = (query, options = {}) => {
  return useQuery({
    queryKey: [NOTES_QUERY_KEY, 'search', query],
    queryFn: async () => {
      const response = await notesApi.search(query);
      
      // Decrypt search results
      if (response.data && Array.isArray(response.data)) {
        response.data = await Promise.all(
          response.data.map(note => decryptNoteData(note))
        );
      }
      
      return response;
    },
    enabled: !!query && query.length > 0,
    ...options
  });
};
