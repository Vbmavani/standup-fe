import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from '../api/client';
import { qk } from '../api/queryKeys';

export function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (err, query) => {
        // Session expired mid-use: flip to signed-out so ProtectedRoute redirects.
        if (isApiError(err) && err.status === 401 && query.queryKey[0] !== 'me') {
          client.setQueryData(qk.me, null);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (err) => {
        if (isApiError(err) && err.status === 401) client.setQueryData(qk.me, null);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, err) => {
          if (isApiError(err) && err.status >= 400 && err.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
  return client;
}
