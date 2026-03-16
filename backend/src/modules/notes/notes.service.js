import { prisma } from '../../config/database.js';
import { queueMetadataEnrichment } from './notes.metadata.js';
import { buildNoteScalarSelect, supportsNoteMetadataColumns } from './notes.compat.js';

function getMetadataStatus(data, existingNote = null) {
  const url = data.url !== undefined ? data.url : existingNote?.url;
  if (!url) {
    return 'idle';
  }

  if (data.previewData) {
    return 'ready';
  }

  if (data.metadataStatus) {
    return data.metadataStatus;
  }

  return 'queued';
}

export const notesService = {
  async listNotes(userId, tenantId, filters) {
    const { page, limit, folderId, tags, pinned } = filters;
    const skip = (page - 1) * limit;
    const includeMetadata = await supportsNoteMetadataColumns();

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
        select: {
          ...buildNoteScalarSelect(includeMetadata),
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
    const includeMetadata = await supportsNoteMetadataColumns();

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        tenantId
      },
      select: {
        ...buildNoteScalarSelect(includeMetadata),
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
    const includeMetadata = await supportsNoteMetadataColumns();
    const metadataStatus = getMetadataStatus(data);
    const { metadataStatus: _metadataStatus, ...persistedData } = data;

    const note = await prisma.note.create({
      data: {
        ...persistedData,
        userId,
        tenantId,
        ...(includeMetadata && {
          metadataStatus,
          metadataFetchedAt: metadataStatus === 'ready' ? new Date() : null
        })
      },
      select: {
        ...buildNoteScalarSelect(includeMetadata),
        folder: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (includeMetadata && note.url && metadataStatus === 'queued') {
      queueMetadataEnrichment({
        noteId: note.id,
        userId,
        tenantId,
        url: note.url
      });
    }

    return note;
  },

  async updateNote(userId, tenantId, noteId, data) {
    const includeMetadata = await supportsNoteMetadataColumns();
    const { metadataStatus: _metadataStatus, ...persistedData } = data;
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        tenantId
      },
      select: buildNoteScalarSelect(includeMetadata)
    });

    if (!existingNote) {
      throw new Error('Note not found');
    }

    const metadataStatus = getMetadataStatus(data, existingNote);
    const shouldRefreshMetadata = Boolean(
      (data.url !== undefined && data.url !== existingNote.url) ||
      (data.previewData === null && (data.url !== undefined ? data.url : existingNote.url))
    );

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...persistedData,
        ...(includeMetadata && {
          metadataStatus: shouldRefreshMetadata ? 'queued' : metadataStatus,
          metadataFetchedAt: shouldRefreshMetadata ? null : existingNote.metadataFetchedAt
        })
      },
      select: {
        ...buildNoteScalarSelect(includeMetadata),
        folder: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (includeMetadata && note.url && (shouldRefreshMetadata || note.metadataStatus === 'queued')) {
      queueMetadataEnrichment({
        noteId: note.id,
        userId,
        tenantId,
        url: note.url
      });
    }

    return note;
  },

  async deleteNote(userId, tenantId, noteId) {
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
        tenantId
      },
      select: { id: true }
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
    const includeMetadata = await supportsNoteMetadataColumns();

    const notes = await prisma.note.findMany({
      where: {
        userId,
        tenantId,
        tags: { hasSome: [query] }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        ...buildNoteScalarSelect(includeMetadata),
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
