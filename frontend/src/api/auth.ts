import apiClient from "./client";
import axios from "axios";
import type { RegisterPayload, LoginPayload, TokenResponse } from "../types/authTypes";

export const requestPasswordReset = (identifier: string) =>
  axios.post(`${import.meta.env.VITE_API_URL}/api/auth/password-reset/`, { identifier });

export const confirmPasswordReset = (data: {
  uid: string;
  token: string;
  new_password: string;
  new_password2: string;
}) => axios.post(`${import.meta.env.VITE_API_URL}/api/auth/password-reset/confirm/`, data);

export const registerUser = (data: RegisterPayload) =>
  axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register/`, data);

// TODO: send identifier
export const loginUser = (data: LoginPayload): Promise<{ data: TokenResponse }> =>
  axios.post(`${import.meta.env.VITE_API_URL}/api/auth/token/`, data);

export const logoutUser = (refreshToken: string) =>
  apiClient.post("/api/auth/logout/", { refresh: refreshToken });

export const getMe = () =>
  apiClient.get("/api/auth/me/");

export const updateMe = (data: FormData | { username?: string }) =>
  apiClient.patch("/api/auth/me/", data);