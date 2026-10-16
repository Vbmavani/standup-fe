import { isApiError } from '../api/client';

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isApiError(err)) return err.message || fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
