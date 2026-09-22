'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

export function StatusFilterTabs({
  tabs,
  paramName,
  basePath,
}: {
  tabs: { value: string; label: string; count?: number }[];
  paramName: string;
  basePath: string;
}) {
  const params = useSearchParams();
  const current = params.get(paramName) ?? '';

  function hrefFor(value: string): string {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(paramName, value);
    else next.delete(paramName);
    next.delete('page');
    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tabs.map((tab) => {
        const active = current === tab.value;
        return (
          <Link
            key={tab.value || 'all'}
            href={hrefFor(tab.value)}
            scroll={false}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-200',
              active ? 'bg-ink text-white' : 'bg-surface text-ink-muted shadow-xs hover:text-ink',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] font-bold',
                  active ? 'bg-white/20' : 'bg-surface-muted',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
