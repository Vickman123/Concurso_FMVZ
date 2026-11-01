/**
 * Centralized API and SSE resolver for FMVZ Halloween Contest.
 * Decouples the frontend from backend deployment location using VITE_API_URL.
 * If VITE_API_URL is undefined or empty, returns relative path (default behavior).
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) {
    return cleanPath;
  }
  return `${API_BASE}${cleanPath}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(path), init);
}

export function getEventSourceUrl(path: string): string {
  return getApiUrl(path);
}

export { API_BASE };
