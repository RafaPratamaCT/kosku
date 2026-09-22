import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none',
  {
    variants: {
      tone: {
        neutral: 'bg-neutralchip-soft text-neutralchip',
        brand: 'bg-brand-soft text-brand-ink',
        success: 'bg-mint text-brand-ink',
        warn: 'bg-warn-soft text-warn',
        danger: 'bg-danger-soft text-danger',
        info: 'bg-info-soft text-info',
        outline: 'border border-line-strong bg-surface text-ink-muted',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: '',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/** Titik kecil agar status tidak hanya dibedakan lewat warna. */
export function Dot({ className }: { className?: string }) {
  return <span className={cn('size-1.5 rounded-full bg-current opacity-70', className)} />;
}
