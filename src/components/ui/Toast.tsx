import clsx from 'clsx';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconAlert, IconCheck, IconInfo, IconX } from './icons';

type ToastTone = 'success' | 'error' | 'info';
type ToastItem = { id: number; tone: ToastTone; message: string };

type ToastApi = {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={clsx(
              'animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg',
              'dark:bg-zinc-900',
              t.tone === 'error' ? 'border-red-200 dark:border-red-500/30' : 'border-zinc-200 dark:border-zinc-800',
            )}
          >
            <span
              className={clsx(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                t.tone === 'success' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                t.tone === 'error' && 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
                t.tone === 'info' && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
              )}
            >
              {t.tone === 'success' ? (
                <IconCheck className="h-3 w-3" />
              ) : t.tone === 'error' ? (
                <IconAlert className="h-3 w-3" />
              ) : (
                <IconInfo className="h-3 w-3" />
              )}
            </span>
            <p className="flex-1 text-zinc-800 dark:text-zinc-200">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded text-zinc-400 hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:hover:text-zinc-200"
              aria-label="Dismiss notification"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
