const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }
  return process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:5000/api/v1'
    : '/api/v1';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT_MS: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
  },
} as const;
