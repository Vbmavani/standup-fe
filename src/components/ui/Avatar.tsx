import clsx from 'clsx';
import { avatarColor, initials } from '../../lib/format';

const sizes = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function Avatar({
  name,
  id,
  size = 'md',
  className,
}: {
  name: string | null | undefined;
  id?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      title={name ?? undefined}
      aria-hidden={!name}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white select-none dark:ring-zinc-900',
        avatarColor(id ?? name ?? '?'),
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
