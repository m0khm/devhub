import axios from 'axios';
import { safeStorage } from '../shared/utils/storage';

export const API_URL =
  (import.meta as any).env?.VITE_API_URL || `${window.location.origin}/api`;

// Backward-compatible alias
export const API_BASE_URL = API_URL;



export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function attachAuthHeader(config: any) {
  const token = getAuthToken();
  if (!token) return config;

  // Axios v1 может использовать AxiosHeaders (у него есть .set)
  if ((config.headers as any)?.set) {
    (config.headers as any).set('Authorization', `Bearer ${token}`);
  } else {
    config.headers = config.headers || {};
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }

  return config;
}

apiClient.interceptors.request.use(attachAuthHeader);

export function getAuthToken(): string | null {
  return safeStorage.get('auth_token') || localStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token');
}

export function getApiBaseUrl(): string {
  return API_URL;
}

// WS URL for Deploy terminal
export function getDeployTerminalWsUrl(projectId: string, serverId: string, token?: string) {
  const apiBase = getApiBaseUrl(); // e.g. https://dvhub.tech/api
  const apiUrl = new URL(String(apiBase), window.location.origin);

  // https -> wss, http -> ws
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';

  const basePath = apiUrl.pathname.replace(/\/+$/, '');
  apiUrl.pathname = `${basePath}/projects/${projectId}/deploy/servers/${serverId}/terminal/ws`;

  // add token if present
  apiUrl.search = '';
  if (token) apiUrl.searchParams.set('token', token);

  return apiUrl.toString();
}
