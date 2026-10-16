import clsx from 'clsx';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Minimal accessible popover menu: click to toggle, closes on outside click / Escape / item select. */
export function Dropdown({
  trigger,
  children,
  align = 'left',
  side = 'bottom',
  className,
  menuClassName,
}: {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  side?: 'bottom' | 'top';
  className?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className={clsx('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <div
          role="menu"
          className={clsx(
            'animate-pop-in absolute z-40 min-w-[12rem] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg',
            'dark:border-zinc-800 dark:bg-zinc-900',
            align === 'right' ? 'right-0' : 'left-0',
            side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
            menuClassName,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export const menuItemClass = clsx(
  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-zinc-700 transition-colors',
  'hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none',
  'dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800',
);

export function MenuSeparator() {
  return <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
      {children}
    </div>
  );
}
