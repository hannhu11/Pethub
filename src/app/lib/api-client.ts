import axios from 'axios';

let accessToken: string | null = null;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
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
