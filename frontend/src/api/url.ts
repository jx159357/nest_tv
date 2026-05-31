const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const buildApiUrl = (path: string): string => {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
};
