/**
 * Database Connection & Client Configuration
 *
 * This layer is responsible for establishing, managing, and closing
 * connections to the persistent database (e.g., PostgreSQL, MongoDB, Prisma, etc.).
 *
 * Repositories will consume this client. Services will NEVER touch this file or the client.
 */

export interface DatabaseClient {
  isConnected: () => boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

class AppDatabase implements DatabaseClient {
  private connected: boolean = false;

  public async connect(): Promise<void> {
    // In production, instantiate your ORM/DB pool here (e.g., PrismaClient, pg Pool, mongoose)
    this.connected = true;
    console.log('[Database] Database connection established successfully.');
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[Database] Database connection closed.');
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export const db = new AppDatabase();
