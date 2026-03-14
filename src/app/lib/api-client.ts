import axios from 'axios';

let accessToken: string | null = null;

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  const devDefault = 'http://localhost:4000/api';
  const prodDefault = '/api';

  const fallback = import.meta.env.PROD ? prodDefault : devDefault;
  if (!configured) {
    return fallback;
  }

  // Guard against stale build/env values that point to insecure HTTP IPs.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && configured.startsWith('http://')) {
    return prodDefault;
  }

  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  if (!accessToken) {
    return config;
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function extractApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
  }

  const responseMessage =
    (error.response?.data as { message?: string | string[] } | undefined)?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(', ');
  }

  if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
    return responseMessage;
  }

  return error.message || 'Không thể kết nối đến API.';
}
