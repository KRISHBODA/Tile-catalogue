import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';

export const createApp = (): Application => {
  const app: Application = express();

  // 1. Global Pre-Routing Middlewares
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    let sameOrigin = false;
    if (origin && req.headers.host) {
      try { sameOrigin = new URL(origin).host === req.headers.host; } catch { /* Invalid origins are rejected below. */ }
    }
    cors({
      origin: !origin || sameOrigin || env.CORS_ORIGIN.includes(origin) || env.NODE_ENV === 'development',
      credentials: true,
    })(req, res, next);
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(requestLogger);

  // 2. Base & API Routes
  app.get('/', (_req, res) => {
    res.json({
      name: 'Tile Catalogue Backend API',
      status: 'active',
      docs: `${env.API_PREFIX}/health`,
    });
  });

  app.use(env.API_PREFIX, apiRouter);

  // 3. 404 Handler for undefined routes
  app.use(notFoundHandler);

  // 4. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
};

// Vercel invokes the app directly; local development continues to use server.ts.
export default createApp();
