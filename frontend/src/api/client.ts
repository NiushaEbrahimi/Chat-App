import axios from "axios";
import { store } from "../store";
import { logout, updateToken } from "../store/slices/authSlice";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Don't set Content-Type for FormData - let axios handle it
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  
  return config;
});

// ─── Refresh queue ──────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (value: string | null) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// ─── Response Interceptor ───────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest.url ?? "";

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (requestUrl.includes("/api/auth/token/") && !requestUrl.includes("refresh")) {
      return Promise.reject(error);
    }

    if (requestUrl.includes("/api/auth/token/refresh/")) {
      store.dispatch(logout());
      // window.location.href = "/auth/login";
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      store.dispatch(logout());
      // window.location.href = "/auth/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = store.getState().auth.refreshToken;
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      store.dispatch(updateToken({
        token: data.access,
        refreshToken: data.refresh ?? undefined,
      }));

      processQueue(null, data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(logout());
      // window.location.href = "/auth/login";
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;