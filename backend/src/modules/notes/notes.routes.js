import { notesController } from './notes.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';

export default async function notesRoutes(app) {
  // All notes routes require authentication and tenant
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireTenant);

  app.get('/', notesController.list);
  app.get('/search', notesController.search);
  app.get('/:id', notesController.getById);
  app.post('/', notesController.create);
  app.put('/:id', notesController.update);
  app.delete('/:id', notesController.delete);
}
