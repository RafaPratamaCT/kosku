'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/kosku', label: 'Beranda' },
  { href: '/kosku/rooms', label: 'Kamar' },
  { href: '/kosku#fasilitas', label: 'Fasilitas' },
  { href: '/kosku#aturan', label: 'Aturan' },
  { href: '/kosku#faq', label: 'FAQ' },
  { href: '/kosku#kontak', label: 'Kontak' },
] as const;

export function SiteNav({
  kosName,
  user,
}: {
  kosName: string;
  user: { fullName: string; role: 'ADMIN' | 'TENANT' } | null;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const dashboardHref = user?.role === 'ADMIN' ? '/kosku/admin' : '/kosku/tenant';

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link href="/kosku" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-brand text-[15px] font-bold text-white">
            K
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">{kosName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-sm px-3 py-2 text-[13.5px] font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink',
                pathname === link.href && 'text-ink',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <ButtonLink href={dashboardHref} size="sm">
              Buka dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/kosku/login" variant="ghost" size="sm">
                Masuk
              </ButtonLink>
              <ButtonLink href="/kosku/rooms" size="sm">
                Lihat kamar
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-md text-ink transition hover:bg-surface-muted lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="animate-fade-in border-t border-line bg-canvas lg:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sm px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-surface-muted hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <ButtonLink href={dashboardHref} className="w-full">
                  Buka dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/kosku/rooms" className="w-full">
                    Lihat kamar
                  </ButtonLink>
                  <ButtonLink href="/kosku/login" variant="outline" className="w-full">
                    Masuk
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
