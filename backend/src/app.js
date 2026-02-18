import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import notesRoutes from './modules/notes/notes.routes.js';
import foldersRoutes from './modules/folders/folders.routes.js';
import relationsRoutes from './modules/relations/relations.routes.js';
import appsRoutes from './modules/apps/apps.routes.js';
import tenantsRoutes from './modules/tenants/tenants.routes.js';
import onboardingRoutes from './modules/onboarding/onboarding.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: logger
  });

  // Register plugins
  await app.register(helmet, {
    contentSecurityPolicy: false
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Id']
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // Error handling
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(notesRoutes, { prefix: '/api/notes' });
  await app.register(foldersRoutes, { prefix: '/api/folders' });
  await app.register(relationsRoutes, { prefix: '/api/relations' });
  await app.register(appsRoutes, { prefix: '/api/apps' });
  await app.register(tenantsRoutes, { prefix: '/api/tenants' });
  await app.register(onboardingRoutes, { prefix: '/api/onboarding' });

  return app;
}
