import { DashboardShell, type NavGroup } from '@/components/dashboard/shell';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  const [kosName, unread, pendingBookings, openComplaints, pendingRequests, unpaidBills] =
    await Promise.all([
      getSetting('kosName'),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.request.count({ where: { status: 'PENDING' } }),
      prisma.bill.count({
        where: { status: { in: ['UNPAID', 'OVERDUE', 'WAITING_VERIFICATION'] } },
      }),
    ]);

  const groups: NavGroup[] = [
    {
      items: [{ href: '/kosku/admin', label: 'Dashboard', icon: 'dashboard', exact: true }],
    },
    {
      title: 'Hunian',
      items: [
        { href: '/kosku/admin/rooms', label: 'Kamar', icon: 'room' },
        {
          href: '/kosku/admin/bookings',
          label: 'Booking',
          icon: 'booking',
          badge: pendingBookings,
        },
        { href: '/kosku/admin/tenants', label: 'Penghuni', icon: 'users' },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        { href: '/kosku/admin/bills', label: 'Tagihan', icon: 'bill', badge: unpaidBills },
        { href: '/kosku/admin/finance', label: 'Laporan keuangan', icon: 'wallet' },
      ],
    },
    {
      title: 'Layanan',
      items: [
        {
          href: '/kosku/admin/complaints',
          label: 'Komplain',
          icon: 'complaint',
          badge: openComplaints,
        },
        {
          href: '/kosku/admin/requests',
          label: 'Pengajuan',
          icon: 'request',
          badge: pendingRequests,
        },
        { href: '/kosku/admin/announcements', label: 'Pengumuman', icon: 'announcement' },
      ],
    },
    {
      title: 'Lainnya',
      items: [{ href: '/kosku/admin/settings', label: 'Pengaturan', icon: 'settings' }],
    },
  ];

  return (
    <DashboardShell
      groups={groups}
      brand={kosName}
      unread={unread}
      user={{ fullName: user.fullName, role: 'ADMIN', username: user.username }}
    >
      {children}
    </DashboardShell>
  );
}
