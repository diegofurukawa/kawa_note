import { prisma } from '../../config/database.js';

export const foldersService = {
  async listFolders(userId, tenantId, parentId = null) {
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        tenantId,
        parentFolderId: parentId
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true
          }
        }
      }
    });

    return folders;
  },

  async getFolderHierarchy(userId, tenantId) {
    const folders = await prisma.folder.findMany({
      where: { userId, tenantId },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true
          }
        }
      }
    });

    // Build tree structure
    const folderMap = new Map();
    const rootFolders = [];

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (folder.parentFolderId && folderMap.has(folder.parentFolderId)) {
        folderMap.get(folder.parentFolderId).children.push(node);
      } else {
        rootFolders.push(node);
      }
    });

    return rootFolders;
  },

  async getFolderById(userId, tenantId, folderId) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
        tenantId
      },
      include: {
        subFolders: {
          orderBy: [
            { order: 'asc' },
            { name: 'asc' }
          ],
          include: {
            _count: {
              select: {
                notes: true,
                subFolders: true
              }
            }
          }
        },
        notes: {
          orderBy: [
            { pinned: 'desc' },
            { updatedAt: 'desc' }
          ],
          take: 50
        },
        _count: {
          select: {
            notes: true,
            subFolders: true
          }
        }
      }
    });

    return folder;
  },

  async createFolder(userId, tenantId, data) {
    // Validate parent folder exists and belongs to user/tenant
    if (data.parentFolderId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: data.parentFolderId,
          userId,
          tenantId
        }
      });

      if (!parentFolder) {
        throw new Error('Parent folder not found');
      }
    }

    const folder = await prisma.folder.create({
      data: {
        ...data,
        userId,
        tenantId
      },
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true
          }
        }
      }
    });

    return folder;
  },

  async updateFolder(userId, tenantId, folderId, data) {
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
        tenantId
      }
    });

    if (!existingFolder) {
      throw new Error('Folder not found');
    }

    // Validate parent folder if provided
    if (data.parentFolderId) {
      if (data.parentFolderId === folderId) {
        throw new Error('Folder cannot be its own parent');
      }

      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: data.parentFolderId,
          userId,
          tenantId
        }
      });

      if (!parentFolder) {
        throw new Error('Parent folder not found');
      }

      // Check for circular reference
      let current = parentFolder;
      while (current.parentFolderId) {
        if (current.parentFolderId === folderId) {
          throw new Error('Circular reference detected');
        }
        current = await prisma.folder.findUnique({
          where: { id: current.parentFolderId }
        });
      }
    }

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data,
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true
          }
        }
      }
    });

    return folder;
  },

  async deleteFolder(userId, tenantId, folderId) {
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
        tenantId
      }
    });

    if (!existingFolder) {
      throw new Error('Folder not found');
    }

    await prisma.folder.delete({
      where: { id: folderId }
    });

    return { id: folderId };
  },

  async getFolderNotes(userId, tenantId, folderId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
        tenantId
      }
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: {
          folderId,
          userId,
          tenantId
        },
        skip,
        take: limit,
        orderBy: [
          { pinned: 'desc' },
          { updatedAt: 'desc' }
        ]
      }),
      prisma.note.count({
        where: {
          folderId,
          userId,
          tenantId
        }
      })
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
