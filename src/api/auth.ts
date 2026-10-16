import { api } from './client';
import type { User } from './types';

export const authApi = {
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.user),
  signIn: (body: { email: string; password: string }) =>
    api.post<{ user: User }>('/auth/signin', body).then((r) => r.user),
  signUp: (body: { name: string; email: string; password: string }) =>
    api.post<{ user: User }>('/auth/signup', body).then((r) => r.user),
  signOut: () => api.post<void>('/auth/signout'),
};

export const usersApi = {
  updateMe: (body: { name: string }) => api.patch<{ user: User }>('/users/me', body).then((r) => r.user),
};
