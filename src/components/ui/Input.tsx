import clsx from 'clsx';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const fieldClass = clsx(
  'block w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-colors',
  'placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
  'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500',
  'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900/60',
  'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20',
);

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {children}
      </label>
      {hint && <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </div>
  );
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}

/** Form-level error banner, used for ApiError messages. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
    >
      {children}
    </div>
  );
}

type FieldProps = { label?: ReactNode; hint?: ReactNode; error?: ReactNode };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(function Input(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      {label && <Label htmlFor={inputId} hint={hint}>{label}</Label>}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={clsx(fieldClass, 'h-9')}
        {...rest}
      />
      <FieldError id={`${inputId}-err`}>{error}</FieldError>
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  function Textarea({ label, hint, error, className, id, rows = 3, ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className={className}>
        {label && <Label htmlFor={inputId} hint={hint}>{label}</Label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          className={clsx(fieldClass, 'resize-y py-2 leading-relaxed')}
          {...rest}
        />
        <FieldError>{error}</FieldError>
      </div>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  function Select({ label, hint, error, className, id, children, ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className={className}>
        {label && <Label htmlFor={inputId} hint={hint}>{label}</Label>}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={clsx(fieldClass, 'h-9 pr-8')}
          {...rest}
        >
          {children}
        </select>
        <FieldError>{error}</FieldError>
      </div>
    );
  },
);
