import type { ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { IconLogo } from '../ui/icons';
import { UserMenu } from './UserMenu';

export function Brand() {
  return (
    <Link
      to="/teams"
      className="flex items-center gap-2 rounded-lg font-semibold tracking-tight text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-zinc-100"
    >
      <IconLogo />
      <span>Standup Board</span>
    </Link>
  );
}

/** Shell for non-team pages (/teams, /profile): simple top bar. */
export function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <UserMenu compact />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
