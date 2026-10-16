import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { authApi, usersApi } from '../api/auth';
import { isApiError } from '../api/client';
import { qk } from '../api/queryKeys';
import type { User } from '../api/types';

/**
 * Drop every cached query except ['me'] and set the current user.
 * (QueryClient.clear() would also detach the mounted ['me'] observers, so route guards
 * would never see the new value.)
 */
function resetCacheFor(qc: QueryClient, user: User | null) {
  qc.cancelQueries({ predicate: (q) => q.queryKey[0] !== 'me' }).catch(() => undefined);
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  qc.setQueryData(qk.me, user);
}

async function fetchMe(): Promise<User | null> {
  try {
    return await authApi.me();
  } catch (err) {
    if (isApiError(err) && err.status === 401) return null;
    throw err;
  }
}

export function useAuth() {
  const query = useQuery({
    queryKey: qk.me,
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
  });
  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (user) => resetCacheFor(qc, user),
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.signUp,
    onSuccess: (user) => resetCacheFor(qc, user),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.signOut,
    // Clear everything (even if the request failed, the user wants out).
    onSettled: () => resetCacheFor(qc, null),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (user) => {
      qc.setQueryData(qk.me, user);
      // Names appear in members, standups, activity, etc.
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    },
  });
}
