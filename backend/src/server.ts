import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './config/database.js';
import http from 'http';

const startServer = async (): Promise<void> => {
  try {
    // 1. Establish database connection
    await db.connect();

    // 2. Initialize application
    const app = createApp();
    const server = http.createServer(app);

    // 3. Start HTTP server
    server.listen(env.PORT, env.HOST, () => {
      console.log('====================================================');
      console.log(`🚀 Server ready in [${env.NODE_ENV}] mode`);
      console.log(`📡 URL: http://${env.HOST}:${env.PORT}`);
      console.log(`🩺 Health check: http://${env.HOST}:${env.PORT}${env.API_PREFIX}/health`);
      console.log(`📦 Products API: http://${env.HOST}:${env.PORT}${env.API_PREFIX}/products`);
      console.log('====================================================');
    });

    // 4. Graceful shutdown handler
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

      server.close(async () => {
        console.log('[Server] HTTP connections closed.');
        try {
          await db.disconnect();
          console.log('[Server] Graceful shutdown completed.');
          process.exit(0);
        } catch (error) {
          console.error('[Server] Error during database disconnect:', error);
          process.exit(1);
        }
      });

      // Force shutdown if connections do not close in time
      setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      console.error('[Server] Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('[Server] Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('[Server] Failed to initialize backend server:', error);
    process.exit(1);
  }
};

void startServer();
