import { prisma } from '../../config/database.js';

export const notesService = {
  async listNotes(userId, tenantId, filters) {
    const { page, limit, folderId, tags, pinned } = filters;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      tenantId,
      ...(folderId && { folderId }),
      ...(pinned !== undefined && { pinned }),
      ...(tags && {
        tags: {
          hasSome: tags.split(',')
        }
      })
    };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { pinned: 'desc' },
          { updatedAt: 'desc' }
        ],
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          relationsFrom: {
            include: {
              noteTo: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      }),
      prisma.note.count({ where })
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
  },

  async getNoteById(userId, tenantId, noteId) {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        tenantId
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        relationsFrom: {
          include: {
            noteTo: {
              select: {
                id: true,
                title: true,
                type: true
              }
            }
          }
        },
        relationsTo: {
          include: {
            noteFrom: {
              select: {
                id: true,
                title: true,
                type: true
              }
            }
          }
        }
      }
    });

    return note;
  },

  async createNote(userId, tenantId, data) {
    const note = await prisma.note.create({
      data: {
        ...data,
        userId,
        tenantId
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return note;
  },

  async updateNote(userId, tenantId, noteId, data) {
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        tenantId
      }
    });

    if (!existingNote) {
      throw new Error('Note not found');
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return note;
  },

  async deleteNote(userId, tenantId, noteId) {
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        tenantId
      }
    });

    if (!existingNote) {
      throw new Error('Note not found');
    }

    await prisma.note.delete({
      where: { id: noteId }
    });

    return { id: noteId };
  },

  async searchNotes(userId, tenantId, query) {
    // Text search on encrypted fields is not supported in E2E architecture
    // Search is performed client-side after decryption
    // This endpoint now only searches by tags
    const notes = await prisma.note.findMany({
      where: {
        userId,
        tenantId,
        tags: { hasSome: [query] }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return notes;
  }
};
