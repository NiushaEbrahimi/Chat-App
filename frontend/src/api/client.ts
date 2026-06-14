import axios from "axios";
import { store } from "../store";
import { login, logout } from "../store/slices/authSlice";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});


apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


let isRefreshing = false;
let failedQueue: { resolve: (value: string | null) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};


apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest.url ?? "";

    // not a 401 — throw it normally (404, 500, etc)
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    
    // wrong credentials on login — do nothing, let the error bubble up to the form
    if (requestUrl.includes("/api/auth/token/") && !requestUrl.includes("refresh")) {
        return Promise.reject(error);
    }

    // refresh token itself failed — logout immediately, don't retry
    if (requestUrl.includes("/api/auth/token/refresh/")) {
        store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(error);
    }

    // another request is already refreshing — join the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    // first 401 — start the refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = store.getState().auth.refreshToken;
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      // save new access token to Redux
      store.dispatch(login({
        user: store.getState().auth.user!,
        token: data.access,
        refreshToken: data.refresh ?? refreshToken,
      }));

      processQueue(null, data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(logout());
      window.location.href = "/login";
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;