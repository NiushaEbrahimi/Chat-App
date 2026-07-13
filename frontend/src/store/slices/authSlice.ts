import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { User, AuthState } from "../../types/authTypes";

const getInitialAuthState = (): AuthState => {
  const storedToken = localStorage.getItem('access_token') ?? localStorage.getItem('authToken');
  const storedRefreshToken = localStorage.getItem('refresh_token') ?? (() => {
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) return null;
    try {
      return JSON.parse(authTokens)?.refresh ?? null;
    } catch {
      return null;
    }
  })();
  const storedUser = localStorage.getItem('user');

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: Boolean(storedToken),
    refreshToken: storedRefreshToken,
    rateLimitUntil: null,
  };
};

const initialState: AuthState = getInitialAuthState();

let storeRef: { dispatch: (action: any) => void } | null = null;

export const setStoreRef = (store: { dispatch: (action: any) => void }) => {
  storeRef = store;
};

// Listen for localStorage changes (e.g., user clears localStorage)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'access_token' && !event.newValue && storeRef) {
      storeRef.dispatch(logout());
    }
  });
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.rateLimitUntil = null;

      localStorage.setItem('access_token', action.payload.token);
      localStorage.setItem('refresh_token', action.payload.refreshToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.rateLimitUntil = null;

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
    updateToken: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.token = action.payload.token;
      localStorage.setItem('access_token', action.payload.token);

      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('refresh_token', action.payload.refreshToken);
      }
    },
    setRateLimit: (state) => {
      state.rateLimitUntil = Date.now() + 60_000;
    },
    clearRateLimit: (state) => {
      state.rateLimitUntil = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { login, logout, updateToken , setRateLimit, clearRateLimit, updateUser } = authSlice.actions;
export default authSlice.reducer;