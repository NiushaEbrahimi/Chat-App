import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export type ApiError = AxiosError<ApiErrorResponse>;

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiError;
    const data = apiError.response?.data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data?.errors) {
      return Object.values(data.errors).flat().join(', ');
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
