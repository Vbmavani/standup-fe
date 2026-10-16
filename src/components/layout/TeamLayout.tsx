import clsx from 'clsx';
import { useMemo } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { isApiError } from '../../api/client';
import { useTeam } from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth';
import { TeamContext, type TeamContextValue } from '../../hooks/useTeamContext';
import { useTeamEvents } from '../../hooks/useTeamEvents';
import { errorMessage } from '../../lib/errors';
import { Button, Skeleton, Spinner } from '../ui';
import { IconActivity, IconAlert, IconChart, IconColumns, IconLogo, IconMessage, IconSettings } from '../ui/icons';
import { TeamSwitcher } from './TeamSwitcher';
import { UserMenu } from './UserMenu';

const NAV = [
  { to: 'standup', label: 'Standup', icon: IconMessage },
  { to: 'board', label: 'Board', icon: IconColumns },
  { to: 'activity', label: 'Activity', icon: IconActivity },
  { to: 'summary', label: 'Summary', icon: IconChart },
  { to: 'settings', label: 'Settings', icon: IconSettings },
] as const;

function SidebarNav() {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Team">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none',
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function TopNav() {
  return (
    <nav
      className="-mb-px flex [scrollbar-width:none] gap-1 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden"
      aria-label="Team"
    >
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none focus-visible:ring-inset',
              isActive
                ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function TeamUnavailable({
  status,
  message,
  onRetry,
}: {
  status: number | null;
  message: string;
  onRetry?: () => void;
}) {
  const title =
    status === 404 ? 'Team not found' : status === 403 ? "You're not a member of this team" : "Couldn't load this team";
  const body =
    status === 404
      ? 'This team may have been deleted, or the link is wrong.'
      : status === 403
        ? 'Ask a teammate for the invite code to join it.'
        : message;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
          <IconAlert className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{body}</p>
        <div className="mt-6 flex justify-center gap-2">
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Link
            to="/teams"
            className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Back to my teams
          </Link>
        </div>
      </div>
    </div>
  );
}

function LayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 p-4 lg:block dark:border-zinc-800">
        <Skeleton className="h-9 w-full" />
        <div className="mt-6 space-y-2">
          {NAV.map((n) => (
            <Skeleton key={n.to} className="h-8 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 items-center justify-center text-zinc-400">
        <Spinner className="h-6 w-6" />
      </div>
    </div>
  );
}

export function TeamLayout() {
  const { teamId = '' } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const teamQuery = useTeam(teamId);
  const ok = teamQuery.isSuccess;

  // Only subscribe once membership is confirmed (the stream would 403/404 otherwise).
  useTeamEvents(teamId, ok);

  const ctx = useMemo<TeamContextValue | null>(() => {
    if (!teamQuery.data || !user) return null;
    const { team, members } = teamQuery.data;
    return {
      teamId,
      team,
      members,
      me: user,
      isOwner: team.ownerId === user.id,
      memberById: new Map(members.map((m) => [m.id, m])),
    };
  }, [teamQuery.data, user, teamId]);

  if (teamQuery.isPending) return <LayoutSkeleton />;
  if (teamQuery.isError && !teamQuery.data) {
    const err = teamQuery.error;
    const status = isApiError(err) ? err.status : null;
    return (
      <TeamUnavailable
        status={status}
        message={errorMessage(err)}
        onRetry={status === 403 || status === 404 ? undefined : () => void teamQuery.refetch()}
      />
    );
  }
  if (!ctx) return <LayoutSkeleton />;

  return (
    <TeamContext.Provider value={ctx}>
      <div className="min-h-screen lg:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex h-14 items-center px-4">
            <Link
              to="/teams"
              className="flex items-center gap-2 rounded-lg text-sm font-semibold tracking-tight text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-zinc-100"
            >
              <IconLogo className="h-6 w-6" />
              Standup Board
            </Link>
          </div>
          <div className="px-3">
            <TeamSwitcher team={ctx.team} />
          </div>
          <div className="mt-4 flex-1 overflow-y-auto px-3">
            <SidebarNav />
          </div>
          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <UserMenu side="top" align="left" />
          </div>
        </aside>

        {/* Mobile / tablet top bar */}
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex h-14 items-center gap-2 px-3">
            <Link
              to="/teams"
              aria-label="All teams"
              className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <IconLogo className="h-7 w-7" />
            </Link>
            <div className="min-w-0 flex-1">
              <TeamSwitcher team={ctx.team} compact />
            </div>
            <UserMenu compact />
          </div>
          <TopNav />
        </header>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </TeamContext.Provider>
  );
}
