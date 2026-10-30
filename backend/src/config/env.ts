import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  CORS_ORIGIN: string[];
  API_PREFIX: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SUPER_ADMIN_NAME: string;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
}

const parseCorsOrigin = (origins?: string): string[] => {
  if (!origins) {
    return ['http://127.0.0.1:3000', 'http://localhost:3000'];
  }
  return origins.split(',').map((origin) => origin.trim()).filter(Boolean);
};

export const env: EnvironmentConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  HOST: process.env.HOST || '127.0.0.1',
  CORS_ORIGIN: parseCorsOrigin(process.env.CORS_ORIGIN),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'tile-catalogue-default-jwt-secret-dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'admin@tilecatalog.com',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'Admin@Tile2026',
};
