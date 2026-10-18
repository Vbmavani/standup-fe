import { Link } from 'react-router-dom';

export function NotFoundPage({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={
        embedded
          ? 'flex min-h-[50vh] items-center justify-center'
          : 'flex min-h-screen items-center justify-center px-4'
      }
    >
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to="/teams"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Go to my teams
        </Link>
      </div>
    </div>
  );
}
