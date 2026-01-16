import axios, { AxiosError } from "axios";

function getApiBaseUrl(): string {
  // 1) Если задан VITE_API_URL — используем его (например, для локалки)
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/+$/, ""); // remove trailing /

  // 2) По умолчанию: тот же origin, где открыт фронт
  // Например: http://91.184.243.98:5173 -> API будет http://91.184.243.98/api
  const origin = window.location.origin; // включает порт 5173
  const hostOnly = origin.replace(/:\d+$/, ""); // убираем :5173
  return `${hostOnly}/api`;
}

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Если начнёшь работать с cookie-сессиями — включишь:
  // withCredentials: true,
});

// Request interceptor — добавляем токен
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // удобно видеть куда реально летит запрос
    // console.log("[API]", config.method?.toUpperCase(), config.baseURL + config.url);

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — обработка ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Логи — чтобы не было "Registration failed" без деталей
    console.error("[API ERROR]", {
      url: (error.config?.baseURL || "") + (error.config?.url || ""),
      method: error.config?.method,
      status,
      data,
    });

    if (status === 401) {
      // Unauthorized — удаляем токен и редиректим на логин
      localStorage.removeItem("auth_token");
      // не роняем в бесконечный редирект, если уже на /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// --- Helpers для удобства ---

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem("auth_token", token);
  else localStorage.removeItem("auth_token");
}

export function getAuthToken() {
  return localStorage.getItem("auth_token");
}

// WS URL для топика (тот же хост что и API)
// ВАЖНО: у тебя WS принимает token через query ?token=
export function getTopicWsUrl(topicId: string, token?: string) {
  const t = token || getAuthToken() || "";
  const api = API_BASE_URL; // например http://91.184.243.98/api

  // превращаем http -> ws, https -> wss
  const wsBase = api.startsWith("https://")
    ? api.replace(/^https:\/\//, "wss://")
    : api.replace(/^http:\/\//, "ws://");

  // api уже содержит /api, нам нужен endpoint:
  // ws://HOST/api/topics/:id/ws?token=...
  const url = `${wsBase}/topics/${topicId}/ws${t ? `?token=${encodeURIComponent(t)}` : ""}`;
  return url;
}
