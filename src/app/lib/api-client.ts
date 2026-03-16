import axios from 'axios';

let accessToken: string | null = null;
type AccessTokenResolver = (options?: { forceRefresh?: boolean }) => Promise<string | null>;
let accessTokenResolver: AccessTokenResolver | null = null;
const API_TIMEOUT_MS = 20_000;
const MAX_GET_RETRIES = 1;

function resolveApiBaseUrl(): string {
  const configured =
    import.meta.env.VITE_API_BASE_URL?.trim() || import.meta.env.VITE_API_URL?.trim();
  const devDefault = 'http://localhost:4000/api';
  const prodDefault =
    typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';

  const fallback = import.meta.env.PROD ? prodDefault : devDefault;
  if (!configured) {
    return fallback;
  }

  if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(configured, window.location.origin);
      const hasExplicitHost = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(configured);
      const isIpHost = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(parsed.hostname);
      const isCrossOrigin = hasExplicitHost && parsed.origin !== window.location.origin;

      // Guard against stale env values that point to insecure or external origins.
      if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
        return prodDefault;
      }
      if (import.meta.env.PROD && (isCrossOrigin || isIpHost)) {
        return prodDefault;
      }
    } catch {
      return fallback;
    }
  }

  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

async function resolveAccessToken(options?: { forceRefresh?: boolean }) {
  if (!accessTokenResolver) {
    return accessToken;
  }

  try {
    const token = await accessTokenResolver(options);
    accessToken = token && token.length > 0 ? token : null;
  } catch {
    if (options?.forceRefresh) {
      accessToken = null;
    }
  }

  return accessToken;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

apiClient.interceptors.request.use(async (config) => {
  config.headers = config.headers ?? {};
  if (!config.headers['Cache-Control']) {
    config.headers['Cache-Control'] = 'no-cache';
  }
  if (!config.headers.Pragma) {
    config.headers.Pragma = 'no-cache';
  }
  if (!config.headers.Expires) {
    config.headers.Expires = '0';
  }

  const token = await resolveAccessToken();
  if (!token) {
    return config;
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const requestConfig = error.config as typeof error.config & {
      __retryCount?: number;
      __authRetried?: boolean;
    };
    const method = (requestConfig.method ?? 'get').toLowerCase();
    const retryCount = requestConfig.__retryCount ?? 0;
    const status = error.response?.status ?? 0;

    if (status === 401 && !requestConfig.__authRetried) {
      requestConfig.__authRetried = true;
      const refreshedToken = await resolveAccessToken({ forceRefresh: true });

      if (refreshedToken) {
        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient(requestConfig);
      }
    }

    const hasNoHttpResponse = !error.response;
    const isNetworkFailure =
      hasNoHttpResponse &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message.toLowerCase().includes('timeout'));

    if (method !== 'get' || !isNetworkFailure || retryCount >= MAX_GET_RETRIES) {
      return Promise.reject(error);
    }

    requestConfig.__retryCount = retryCount + 1;
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    return apiClient(requestConfig);
  },
);

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function setApiAccessTokenResolver(resolver: AccessTokenResolver | null) {
  accessTokenResolver = resolver;
}

export function extractApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
  }

  if (!error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')) {
    return 'Network Error';
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
