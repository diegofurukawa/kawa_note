import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationsApi } from './client';

const RELATIONS_QUERY_KEY = 'relations';

/**
 * Hook to fetch relations list
 */
export const useRelations = (params = {}) => {
  return useQuery({
    queryKey: [RELATIONS_QUERY_KEY, params],
    queryFn: () => relationsApi.list(params),
    staleTime: 1000 * 60 * 5
  });
};

/**
 * Hook to fetch related notes for a specific note
 */
export const useRelatedNotes = (noteId) => {
  return useQuery({
    queryKey: [RELATIONS_QUERY_KEY, 'related', noteId],
    queryFn: () => relationsApi.getRelatedNotes(noteId),
    enabled: !!noteId,
    staleTime: 1000 * 60 * 5
  });
};

/**
 * Hook to fetch the relation graph
 */
export const useRelationGraph = () => {
  return useQuery({
    queryKey: [RELATIONS_QUERY_KEY, 'graph'],
    queryFn: () => relationsApi.getGraph(),
    staleTime: 1000 * 60 * 5
  });
};

/**
 * Hook to create a new relation
 */
export const useCreateRelation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (relationData) => relationsApi.create(relationData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY, 'related', variables.noteFromId] });
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY, 'related', variables.noteToId] });
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY, 'graph'] });
    }
  });
};

/**
 * Hook to update an existing relation
 */
export const useUpdateRelation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => relationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY, 'graph'] });
    }
  });
};

/**
 * Hook to delete a relation
 */
export const useDeleteRelation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => relationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONS_QUERY_KEY, 'graph'] });
    }
  });
};
