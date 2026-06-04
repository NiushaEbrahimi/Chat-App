import apiClient from "./client";
import axios from "axios";
import type { RegisterPayload, LoginPayload, TokenResponse } from "../types/authTypes";

export const registerUser = (data: RegisterPayload) =>
  axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register/`, data);

export const loginUser = (data: LoginPayload): Promise<{ data: TokenResponse }> =>
  axios.post(`${import.meta.env.VITE_API_URL}/api/auth/token/`, data);

export const logoutUser = (refreshToken: string) =>
  apiClient.post("/api/auth/logout/", { refresh: refreshToken });

export const getMe = () =>
  apiClient.get("/api/auth/me/");

export const updateMe = (data: FormData | { username?: string }) =>
  apiClient.patch("/api/auth/me/", data);