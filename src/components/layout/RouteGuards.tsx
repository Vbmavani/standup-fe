import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Spinner } from '../ui';
import { errorMessage } from '../../lib/errors';

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-zinc-400">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

function AuthCheckFailed({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{errorMessage(error)}</p>
      <Button variant="secondary" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

export type RedirectState = { from?: string };

export function ProtectedRoute() {
  const { user, isLoading, isError, error, refetch } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullScreenSpinner />;
  if (isError && !user) return <AuthCheckFailed error={error} retry={() => void refetch()} />;
  if (!user) {
    const from = location.pathname + location.search + location.hash;
    return <Navigate to="/signin" replace state={{ from } satisfies RedirectState} />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullScreenSpinner />;
  if (user) {
    const from = (location.state as RedirectState | null)?.from;
    const target = from && from.startsWith('/') && !from.startsWith('/sign') ? from : '/teams';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}
