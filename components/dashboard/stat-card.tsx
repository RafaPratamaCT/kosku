import * as React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { IconBox } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'brand' | 'sky' | 'lilac' | 'peach' | 'mint' | 'neutral';
  trend?: { value: number; label?: string };
  className?: string;
}) {
  const positive = (trend?.value ?? 0) >= 0;

  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[12.5px] font-medium text-ink-muted">{label}</p>
          <p className="truncate text-[24px] font-bold leading-none text-ink sm:text-[26px]">
            {value}
          </p>
        </div>
        {icon ? <IconBox tone={tone}>{icon}</IconBox> : null}
      </div>

      {trend || hint ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
          {trend ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
                positive ? 'bg-mint text-brand-ink' : 'bg-danger-soft text-danger',
              )}
            >
              {positive ? (
                <TrendingUp className="size-3" aria-hidden />
              ) : (
                <TrendingDown className="size-3" aria-hidden />
              )}
              {positive ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
          ) : null}
          {trend?.label ? <span className="text-ink-subtle">{trend.label}</span> : null}
          {hint ? <span className="text-ink-muted">{hint}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}
