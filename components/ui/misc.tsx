import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-md bg-surface-muted', className)} {...props} />;
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />;
}

export function IconBox({
  children,
  tone = 'brand',
  className,
}: {
  children: React.ReactNode;
  tone?: 'brand' | 'sky' | 'lilac' | 'peach' | 'mint' | 'neutral';
  className?: string;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-soft text-brand-ink',
    sky: 'bg-sky text-info',
    lilac: 'bg-lilac text-[#5B4AA8]',
    peach: 'bg-peach text-warn',
    mint: 'bg-mint text-brand-ink',
    neutral: 'bg-surface-muted text-ink-muted',
  };
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-md [&_svg]:size-[18px]',
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-lg bg-surface-muted text-ink-subtle [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'warn' | 'danger';
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const config = {
    info: { cls: 'bg-info-soft text-info', Icon: Info },
    success: { cls: 'bg-mint text-brand-ink', Icon: CheckCircle2 },
    warn: { cls: 'bg-warn-soft text-warn', Icon: TriangleAlert },
    danger: { cls: 'bg-danger-soft text-danger', Icon: AlertCircle },
  }[tone];
  const { Icon } = config;

  return (
    <div className={cn('flex gap-3 rounded-lg px-4 py-3.5', config.cls, className)}>
      <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden />
      <div className="space-y-0.5 text-[13px] leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="space-y-1.5">
        <h1 className="text-[22px] font-bold leading-tight text-ink sm:text-[26px]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'space-y-3',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-[26px] font-bold leading-[1.2] text-ink sm:text-[32px]">{title}</h2>
      {description ? (
        <p className="text-[15px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  baseUrl,
}: {
  page: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;

  const make = (target: number) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${target}`;
  };

  const pages: number[] = [];
  const from = Math.max(1, page - 1);
  const to = Math.min(totalPages, from + 2);
  for (let index = Math.max(1, to - 2); index <= to; index += 1) pages.push(index);

  return (
    <nav
      className="flex items-center justify-between gap-3 px-5 py-4"
      aria-label="Navigasi halaman"
    >
      <p className="text-[12.5px] text-ink-muted">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <PageLink href={make(Math.max(1, page - 1))} disabled={page === 1}>
          Sebelumnya
        </PageLink>
        {pages.map((item) => (
          <PageLink key={item} href={make(item)} active={item === page}>
            {item}
          </PageLink>
        ))}
        <PageLink href={make(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
          Berikutnya
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  const className = cn(
    'inline-flex h-9 min-w-9 items-center justify-center rounded-sm px-3 text-[13px] font-medium transition',
    active ? 'bg-brand text-white' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
    disabled && 'pointer-events-none opacity-40',
  );

  if (disabled) return <span className={className}>{children}</span>;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
