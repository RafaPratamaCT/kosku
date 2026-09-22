'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/field';

export function SearchInput({
  placeholder = 'Cari...',
  paramName = 'q',
  className,
}: {
  placeholder?: string;
  paramName?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = React.useState(params.get(paramName) ?? '');

  React.useEffect(() => {
    setValue(params.get(paramName) ?? '');
  }, [params, paramName]);

  React.useEffect(() => {
    const current = params.get(paramName) ?? '';
    if (value === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(paramName, value);
      else next.delete(paramName);
      next.delete('page');
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 350);

    return () => clearTimeout(timer);
  }, [value, params, paramName, pathname, router]);

  return (
    <div className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 pl-10 pr-9 text-[13.5px]"
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue('')}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-xs text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
