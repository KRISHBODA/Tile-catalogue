import { PrismaClient } from '@prisma/client';

/**
 * Database Connection & Client Configuration
 *
 * This layer manages the Prisma ORM singleton client connection.
 * Repositories consume this client. Services will NEVER touch this file or Prisma directly.
 */

export interface DatabaseClient {
  isConnected: () => boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

class AppDatabase implements DatabaseClient {
  private connected: boolean = false;

  public async connect(): Promise<void> {
    try {
      await prisma.$connect();
      this.connected = true;
      console.log('[Database] Cloud PostgreSQL connected successfully via Prisma.');
    } catch (error) {
      this.connected = false;
      console.error('[Database] Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await prisma.$disconnect();
    this.connected = false;
    console.log('[Database] Database connection closed.');
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export const db = new AppDatabase();
