import { notesService } from './notes.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { 
  createNoteSchema, 
  updateNoteSchema, 
  listNotesQuerySchema, 
  noteIdParamSchema 
} from './notes.schema.js';

export const notesController = {
  async list(request, reply) {
    const filters = listNotesQuerySchema.parse(request.query);
    const result = await notesService.listNotes(request.user.id, request.user.tenantId, filters);
    return reply.send(successResponse(result.notes, 'Notes retrieved successfully'));
  },

  async getById(request, reply) {
    const { id } = noteIdParamSchema.parse(request.params);
    const note = await notesService.getNoteById(request.user.id, request.user.tenantId, id);
    
    if (!note) {
      return reply.status(404).send(errorResponse('Note not found', 'NOT_FOUND', 404));
    }
    
    return reply.send(successResponse(note));
  },

  async create(request, reply) {
    const data = createNoteSchema.parse(request.body);
    const note = await notesService.createNote(request.user.id, request.user.tenantId, data);
    return reply.status(201).send(successResponse(note, 'Note created successfully'));
  },

  async update(request, reply) {
    const { id } = noteIdParamSchema.parse(request.params);
    const data = updateNoteSchema.parse(request.body);
    
    try {
      const note = await notesService.updateNote(request.user.id, request.user.tenantId, id, data);
      return reply.send(successResponse(note, 'Note updated successfully'));
    } catch (error) {
      if (error.message === 'Note not found') {
        return reply.status(404).send(errorResponse('Note not found', 'NOT_FOUND', 404));
      }
      throw error;
    }
  },

  async delete(request, reply) {
    const { id } = noteIdParamSchema.parse(request.params);
    
    try {
      await notesService.deleteNote(request.user.id, request.user.tenantId, id);
      return reply.send(successResponse({ id }, 'Note deleted successfully'));
    } catch (error) {
      if (error.message === 'Note not found') {
        return reply.status(404).send(errorResponse('Note not found', 'NOT_FOUND', 404));
      }
      throw error;
    }
  },

  async search(request, reply) {
    const { q } = request.query;
    
    if (!q || q.trim().length === 0) {
      return reply.status(400).send(errorResponse('Search query is required', 'VALIDATION_ERROR', 400));
    }
    
    const notes = await notesService.searchNotes(request.user.id, request.user.tenantId, q);
    return reply.send(successResponse(notes, 'Search completed'));
  }
};
