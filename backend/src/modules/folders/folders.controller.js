import { foldersService } from './folders.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { 
  createFolderSchema, 
  updateFolderSchema, 
  folderIdParamSchema,
  listFoldersQuerySchema
} from './folders.schema.js';

export const foldersController = {
  async list(request, reply) {
    const { parentId } = listFoldersQuerySchema.parse(request.query);
    const folders = await foldersService.listFolders(request.user.id, request.user.tenantId, parentId);
    return reply.send(successResponse(folders));
  },

  async getHierarchy(request, reply) {
    const folders = await foldersService.getFolderHierarchy(request.user.id, request.user.tenantId);
    return reply.send(successResponse(folders));
  },

  async getById(request, reply) {
    const { id } = folderIdParamSchema.parse(request.params);
    const folder = await foldersService.getFolderById(request.user.id, request.user.tenantId, id);
    
    if (!folder) {
      return reply.status(404).send(errorResponse('Folder not found', 'NOT_FOUND', 404));
    }
    
    return reply.send(successResponse(folder));
  },

  async create(request, reply) {
    const data = createFolderSchema.parse(request.body);
    
    try {
      const folder = await foldersService.createFolder(request.user.id, request.user.tenantId, data);
      return reply.status(201).send(successResponse(folder, 'Folder created successfully'));
    } catch (error) {
      if (error.message === 'Parent folder not found') {
        return reply.status(404).send(errorResponse('Parent folder not found', 'NOT_FOUND', 404));
      }
      throw error;
    }
  },

  async update(request, reply) {
    const { id } = folderIdParamSchema.parse(request.params);
    const data = updateFolderSchema.parse(request.body);
    
    try {
      const folder = await foldersService.updateFolder(request.user.id, request.user.tenantId, id, data);
      return reply.send(successResponse(folder, 'Folder updated successfully'));
    } catch (error) {
      if (error.message === 'Folder not found') {
        return reply.status(404).send(errorResponse('Folder not found', 'NOT_FOUND', 404));
      }
      if (error.message === 'Parent folder not found') {
        return reply.status(404).send(errorResponse('Parent folder not found', 'NOT_FOUND', 404));
      }
      if (error.message === 'Folder cannot be its own parent') {
        return reply.status(400).send(errorResponse('Folder cannot be its own parent', 'VALIDATION_ERROR', 400));
      }
      if (error.message === 'Circular reference detected') {
        return reply.status(400).send(errorResponse('Circular reference detected', 'VALIDATION_ERROR', 400));
      }
      throw error;
    }
  },

  async delete(request, reply) {
    const { id } = folderIdParamSchema.parse(request.params);
    
    try {
      await foldersService.deleteFolder(request.user.id, request.user.tenantId, id);
      return reply.send(successResponse({ id }, 'Folder deleted successfully'));
    } catch (error) {
      if (error.message === 'Folder not found') {
        return reply.status(404).send(errorResponse('Folder not found', 'NOT_FOUND', 404));
      }
      throw error;
    }
  },

  async getNotes(request, reply) {
    const { id } = folderIdParamSchema.parse(request.params);
    const { page, limit } = request.query;
    
    try {
      const result = await foldersService.getFolderNotes(request.user.id, request.user.tenantId, id, { 
        page: page ? parseInt(page) : 1, 
        limit: limit ? parseInt(limit) : 20 
      });
      return reply.send(successResponse(result.notes));
    } catch (error) {
      if (error.message === 'Folder not found') {
        return reply.status(404).send(errorResponse('Folder not found', 'NOT_FOUND', 404));
      }
      throw error;
    }
  }
};
