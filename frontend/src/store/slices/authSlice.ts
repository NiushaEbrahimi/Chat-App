import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type {User, AuthState} from "../../types/authTypes";
// user, token, isAuthenticated, login/logout actions

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    refreshToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
    reducers: {
        login: (state: AuthState, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
        },
        logout: (state: AuthState) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
    },
})
export const {
    login,
    logout,
} = authSlice.actions;
export default authSlice.reducer;