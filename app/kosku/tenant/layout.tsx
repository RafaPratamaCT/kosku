import { DashboardShell, type NavGroup } from '@/components/dashboard/shell';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTenant();

  const [kosName, unread, unpaidCount, openComplaints] = await Promise.all([
    getSetting('kosName'),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.bill.count({
      where: {
        tenancy: { userId: user.id },
        status: { in: ['UNPAID', 'OVERDUE'] },
      },
    }),
    prisma.complaint.count({
      where: { userId: user.id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
  ]);

  const groups: NavGroup[] = [
    {
      items: [{ href: '/kosku/tenant', label: 'Beranda', icon: 'dashboard', exact: true }],
    },
    {
      title: 'Keuangan',
      items: [
        { href: '/kosku/tenant/bills', label: 'Tagihan', icon: 'bill', badge: unpaidCount },
        { href: '/kosku/tenant/payments', label: 'Riwayat pembayaran', icon: 'wallet' },
      ],
    },
    {
      title: 'Layanan',
      items: [
        {
          href: '/kosku/tenant/complaints',
          label: 'Komplain',
          icon: 'complaint',
          badge: openComplaints,
        },
        { href: '/kosku/tenant/requests', label: 'Pengajuan', icon: 'request' },
      ],
    },
    {
      title: 'Informasi',
      items: [
        { href: '/kosku/tenant/announcements', label: 'Pengumuman', icon: 'announcement' },
        { href: '/kosku/tenant/documents', label: 'Dokumen', icon: 'document' },
        { href: '/kosku/tenant/profile', label: 'Profil saya', icon: 'users' },
      ],
    },
  ];

  return (
    <DashboardShell
      groups={groups}
      brand={kosName}
      unread={unread}
      user={{ fullName: user.fullName, role: 'TENANT', username: user.username }}
    >
      {children}
    </DashboardShell>
  );
}
