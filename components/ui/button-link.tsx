import * as React from 'react';
import Link from 'next/link';
import type { VariantProps } from 'class-variance-authority';

import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';

type BaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: React.ReactNode;
};

/**
 * Tautan yang tampil seperti tombol. Dipakai agar tidak ada elemen
 * <button> di dalam <a>, yang tidak valid dan menyulitkan pembaca layar.
 */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: BaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href' | 'className' | 'children'> & {
    href: string;
  }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}

/** Versi untuk tautan keluar aplikasi (unduhan, WhatsApp, peta). */
export function ExternalButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: BaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </a>
  );
}
