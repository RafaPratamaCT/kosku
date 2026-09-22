'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-soft">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-surface-muted/50"
            >
              <span className="text-[14.5px] font-semibold text-ink">{item.question}</span>
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-xs bg-surface-muted text-ink-muted transition-transform duration-300',
                  open && 'rotate-45 bg-brand-soft text-brand-ink',
                )}
              >
                <Plus className="size-4" aria-hidden />
              </span>
            </button>
            <div
              className={cn(
                'grid transition-all duration-300 ease-out',
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[14px] leading-relaxed text-ink-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
