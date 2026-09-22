'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BedDouble,
  CalendarCheck,
  ChevronLeft,
  FileText,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Receipt,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';

import { AuthorCredit } from '@/components/author-credit';
import { DemoNotice } from '@/components/demo-notice';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/actions/auth';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  room: BedDouble,
  booking: CalendarCheck,
  users: Users,
  bill: Receipt,
  wallet: Wallet,
  complaint: MessageSquareWarning,
  request: Inbox,
  announcement: Megaphone,
  document: FileText,
  settings: Settings,
  home: Home,
  bell: Bell,
} satisfies Record<string, LucideIcon>;

export type NavKey = keyof typeof NAV_ICONS;

export type NavItem = {
  href: string;
  label: string;
  icon: NavKey;
  exact?: boolean;
  badge?: number;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export function DashboardShell({
  groups,
  brand,
  user,
  unread,
  children,
}: {
  groups: NavGroup[];
  brand: string;
  user: { fullName: string; role: 'ADMIN' | 'TENANT'; username: string };
  unread: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const roleLabel = user.role === 'ADMIN' ? 'Pemilik kos' : 'Penghuni';
  const notificationsHref =
    user.role === 'ADMIN' ? '/kosku/admin/notifications' : '/kosku/tenant/notifications';

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-300 ease-out lg:flex',
          collapsed ? 'w-[76px]' : 'w-[264px]',
        )}
      >
        <div
          className={cn('flex h-16 items-center gap-2.5 px-5', collapsed && 'justify-center px-0')}
        >
          <Link href="/kosku" className="flex items-center gap-2.5" title="Ke halaman publik">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand text-[15px] font-bold text-white">
              K
            </span>
            {!collapsed ? (
              <span className="truncate text-[14px] font-bold text-ink">{brand}</span>
            ) : null}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarGroups groups={groups} pathname={pathname} collapsed={collapsed} />
        </nav>

        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium text-ink-muted transition hover:bg-surface-muted hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'}
          >
            <ChevronLeft
              className={cn('size-4 transition-transform duration-300', collapsed && 'rotate-180')}
              aria-hidden
            />
            {!collapsed ? 'Ciutkan menu' : null}
          </button>
        </div>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] animate-slide-in-right flex-col bg-surface shadow-pop">
            <div className="flex h-16 items-center justify-between px-5">
              <span className="text-[14px] font-bold text-ink">{brand}</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu"
                className="flex size-9 items-center justify-center rounded-md text-ink-muted transition hover:bg-surface-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2">
              <SidebarGroups groups={groups} pathname={pathname} collapsed={false} />
            </nav>
            <div className="border-t border-line p-3">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium text-danger transition hover:bg-danger-soft"
                >
                  <LogOut className="size-4" aria-hidden />
                  Keluar
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="flex size-10 items-center justify-center rounded-md text-ink transition hover:bg-surface-muted lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>

            <Link
              href="/kosku"
              className="hidden text-[13px] font-medium text-ink-muted transition hover:text-ink sm:block"
            >
              Halaman publik
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href={notificationsHref}
                className="relative flex size-10 items-center justify-center rounded-md text-ink-muted transition hover:bg-surface-muted hover:text-ink"
                aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ''}`}
              >
                <Bell className="size-[18px]" aria-hidden />
                {unread > 0 ? (
                  <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : null}
              </Link>

              <div className="hidden items-center gap-2.5 rounded-md py-1.5 pl-2 pr-1 sm:flex">
                <span className="flex size-9 items-center justify-center rounded-md bg-brand-soft text-[12px] font-bold text-brand-ink">
                  {initials(user.fullName)}
                </span>
                <div className="pr-1 leading-tight">
                  <p className="text-[13px] font-semibold text-ink">{user.fullName}</p>
                  <p className="text-[11.5px] text-ink-muted">{roleLabel}</p>
                </div>
              </div>

              <form action={logoutAction} className="hidden lg:block">
                <Button type="submit" variant="ghost" size="iconSm" aria-label="Keluar">
                  <LogOut aria-hidden />
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto mb-7 w-full max-w-[1180px]">
            <DemoNotice />
          </div>
          <div className="mx-auto w-full max-w-[1180px] animate-fade-up">{children}</div>
          <div className="mx-auto mt-10 w-full max-w-[1180px]">
            <AuthorCredit />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarGroups({
  groups,
  pathname,
  collapsed,
}: {
  groups: NavGroup[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="space-y-6">
      {groups.map((group, index) => (
        <div key={group.title ?? index} className="space-y-1">
          {group.title && !collapsed ? (
            <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
              {group.title}
            </p>
          ) : null}
          {group.items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200',
                  active
                    ? 'bg-brand-soft text-brand-ink'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Icon
                  className={cn('size-[18px] shrink-0', active ? 'text-brand' : 'text-ink-subtle')}
                  aria-hidden
                />
                {!collapsed ? (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-auto rounded-full bg-danger-soft px-1.5 py-0.5 text-[10.5px] font-bold text-danger">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
