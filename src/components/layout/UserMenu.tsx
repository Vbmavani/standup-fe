import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useSignOut } from '../../hooks/useAuth';
import { Avatar, Dropdown, MenuSeparator, menuItemClass, useToast } from '../ui';
import { IconChevronDown, IconGrid, IconLogOut, IconUser } from '../ui/icons';

export function UserMenu({ compact = false, side = 'bottom', align = 'right' }: { compact?: boolean; side?: 'top' | 'bottom'; align?: 'left' | 'right' }) {
  const { user } = useAuth();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const toast = useToast();
  if (!user) return null;

  const onSignOut = async () => {
    try {
      await signOut.mutateAsync();
    } catch {
      toast.error('Signed out locally, but the server could not be reached.');
    }
    navigate('/signin', { replace: true });
  };

  return (
    <Dropdown
      align={align}
      side={side}
      className={compact ? undefined : 'w-full'}
      menuClassName={compact ? undefined : 'w-full'}
      trigger={(p) => (
        <button
          type="button"
          onClick={p.toggle}
          aria-expanded={p['aria-expanded']}
          aria-haspopup={p['aria-haspopup']}
          aria-label="Open user menu"
          className={clsx(
            'flex items-center gap-2 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            'hover:bg-zinc-100 dark:hover:bg-zinc-800',
            compact ? 'p-1' : 'w-full px-2 py-1.5',
          )}
        >
          <Avatar name={user.name} id={user.id} size="md" />
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</span>
              </span>
              <IconChevronDown className="h-4 w-4 text-zinc-400" />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          {compact && (
            <div className="px-2.5 py-2">
              <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
            </div>
          )}
          {compact && <MenuSeparator />}
          <Link role="menuitem" to="/teams" className={menuItemClass} onClick={close}>
            <IconGrid className="h-4 w-4 text-zinc-400" /> All teams
          </Link>
          <Link role="menuitem" to="/profile" className={menuItemClass} onClick={close}>
            <IconUser className="h-4 w-4 text-zinc-400" /> Profile
          </Link>
          <MenuSeparator />
          <button
            role="menuitem"
            type="button"
            className={menuItemClass}
            disabled={signOut.isPending}
            onClick={() => {
              close();
              void onSignOut();
            }}
          >
            <IconLogOut className="h-4 w-4 text-zinc-400" /> Sign out
          </button>
        </>
      )}
    </Dropdown>
  );
}
