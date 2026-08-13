import axios from 'axios';
import { useAuthStore } from '../context/authStore';

// Use relative '/api' in production so Vercel rewrites handle it.
// Only use VITE_API_URL for local development.
const baseURL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL ?? '/api');

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Hydration-safe token reader ────────────────────────────────────────────
// On page reload, Zustand's persist middleware may not have finished hydrating
// the store when the first request fires. We fall back to reading directly
// from localStorage so the Authorization header is never accidentally missing.
function getToken(): string | null {
  // 1. Try the live Zustand store first (already hydrated)
  const storeToken = useAuthStore.getState().token;
  if (storeToken) return storeToken;

  // 2. Fallback: parse raw persisted JSON from localStorage
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token ?? null;
    }
  } catch (_) {
    // JSON parse error or localStorage unavailable — ignore
  }
  return null;
}

// Request interceptor — attaches Bearer token to every outgoing request
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling 401s
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
