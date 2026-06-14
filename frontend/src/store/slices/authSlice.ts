import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { User, AuthState } from "../../types/authTypes";

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  refreshToken: null,
  rateLimitUntil: null,
};

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
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.rateLimitUntil = null;
    },
    setRateLimit: (state) => {
      state.rateLimitUntil = Date.now() + 60_000;
    },
    clearRateLimit: (state) => {
      state.rateLimitUntil = null;
    },
  },
});

export const { login, logout, setRateLimit, clearRateLimit } = authSlice.actions;
export default authSlice.reducer;