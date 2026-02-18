import { z } from 'zod';

const colorEnum = z.enum(['slate', 'blue', 'purple', 'green', 'amber', 'red', 'pink']);

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentFolderId: z.string().uuid().optional().nullable(),
  color: colorEnum.default('slate'),
  icon: z.string().default('folder'),
  order: z.number().int().default(0)
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentFolderId: z.string().uuid().optional().nullable(),
  color: colorEnum.optional(),
  icon: z.string().optional(),
  order: z.number().int().optional()
});

export const folderIdParamSchema = z.object({
  id: z.string().uuid('Invalid folder ID')
});

export const listFoldersQuerySchema = z.object({
  parentId: z.string().uuid().optional().nullable()
});
