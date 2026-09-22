'use client';

import * as React from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (input: { tone?: ToastTone; title: string; description?: string }) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Aman dipakai di luar provider: tidak menampilkan apa pun.
    return { toast: () => undefined };
  }
  return context;
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue['toast']>(
    ({ tone = 'info', title, description }) => {
      counter += 1;
      const id = counter;
      setItems((current) => [...current, { id, tone, title, description }]);
      setTimeout(() => remove(id), 4800);
    },
    [remove],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const config = {
    success: { Icon: CheckCircle2, cls: 'text-brand-ink', bg: 'bg-mint' },
    error: { Icon: TriangleAlert, cls: 'text-danger', bg: 'bg-danger-soft' },
    info: { Icon: Info, cls: 'text-info', bg: 'bg-sky' },
  }[item.tone];
  const { Icon } = config;

  return (
    <div className="pointer-events-auto flex w-full max-w-sm animate-slide-in-right items-start gap-3 rounded-lg bg-surface p-3.5 shadow-pop">
      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-sm', config.bg)}>
        <Icon className={cn('size-4', config.cls)} aria-hidden />
      </div>
      <div className="flex-1 space-y-0.5 pt-0.5">
        <p className="text-[13.5px] font-semibold leading-tight text-ink">{item.title}</p>
        {item.description ? (
          <p className="text-[12.5px] leading-relaxed text-ink-muted">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="rounded-xs p-1 text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
