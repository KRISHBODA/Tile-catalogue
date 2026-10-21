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
};
