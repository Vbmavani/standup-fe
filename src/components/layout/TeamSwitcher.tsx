import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import type { Team } from '../../api/types';
import { useTeams } from '../../hooks/queries';
import { Dropdown, MenuLabel, MenuSeparator, Spinner, menuItemClass } from '../ui';
import { IconCheck, IconChevronDown, IconPlus } from '../ui/icons';

function TeamMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-md bg-indigo-600 font-semibold text-white dark:bg-indigo-500',
        className ?? 'h-7 w-7 text-xs',
      )}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function TeamSwitcher({ team, compact = false }: { team: Team; compact?: boolean }) {
  const teams = useTeams();
  const location = useLocation();
  // Keep the same section when switching teams (e.g. board → board).
  const section = location.pathname.split('/')[3] || 'standup';

  return (
    <Dropdown
      className={compact ? 'min-w-0' : 'w-full'}
      menuClassName={compact ? 'w-64' : 'w-full'}
      trigger={(p) => (
        <button
          type="button"
          onClick={p.toggle}
          aria-expanded={p['aria-expanded']}
          aria-haspopup={p['aria-haspopup']}
          aria-label="Switch team"
          className={clsx(
            'flex min-w-0 items-center gap-2 rounded-lg text-left transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800',
            compact ? 'px-1.5 py-1' : 'w-full px-2 py-1.5',
          )}
        >
          <TeamMark name={team.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{team.name}</span>
            {!compact && (
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
              </span>
            )}
          </span>
          <IconChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Your teams</MenuLabel>
          {teams.isPending ? (
            <div className="flex justify-center py-3 text-zinc-400">
              <Spinner />
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {(teams.data ?? []).map((t) => (
                <Link
                  key={t.id}
                  role="menuitem"
                  to={`/t/${t.id}/${section}`}
                  onClick={close}
                  className={menuItemClass}
                >
                  <TeamMark name={t.name} className="h-5 w-5 text-[10px]" />
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  {t.id === team.id && <IconCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                </Link>
              ))}
            </div>
          )}
          <MenuSeparator />
          <Link role="menuitem" to="/teams" onClick={close} className={menuItemClass}>
            <IconPlus className="h-4 w-4 text-zinc-400" /> Create or join a team
          </Link>
        </>
      )}
    </Dropdown>
  );
}
