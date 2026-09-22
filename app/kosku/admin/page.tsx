import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  CircleAlert,
  Inbox,
  MessageSquareWarning,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import { GenerateBillsButton } from '@/components/admin/generate-bills-button';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card } from '@/components/ui/card';
import { EmptyState, IconBox, PageHeader } from '@/components/ui/misc';
import { BillStatusBadge, ComplaintStatusBadge } from '@/components/ui/status';
import { requireAdmin } from '@/lib/auth';
import { expireStaleBookings } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatDateTime, formatPeriod, formatRupiah, formatRupiahShort } from '@/lib/format';
import { percentChange, revenueByMonth, revenueOfMonth } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Dashboard admin' };

export default async function AdminDashboardPage() {
  await requireAdmin();
  await expireStaleBookings();

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRooms,
    occupiedRooms,
    availableRooms,
    activeTenants,
    thisMonthRevenue,
    lastMonthRevenue,
    arrears,
    openComplaints,
    pendingRequests,
    revenueSeries,
    recentBills,
    recentComplaints,
  ] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { status: 'OCCUPIED' } }),
    prisma.room.count({ where: { status: 'AVAILABLE' } }),
    prisma.tenancy.count({ where: { status: 'ACTIVE' } }),
    revenueOfMonth(now),
    revenueOfMonth(lastMonth),
    prisma.bill.aggregate({
      where: { status: { in: ['UNPAID', 'OVERDUE'] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.request.count({ where: { status: 'PENDING' } }),
    revenueByMonth(12),
    prisma.bill.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        tenancy: {
          select: {
            room: { select: { number: true } },
            user: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.complaint.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { fullName: true } }, room: { select: { number: true } } },
    }),
  ]);

  const occupancy = totalRooms === 0 ? 0 : (occupiedRooms / totalRooms) * 100;
  const revenueChange = percentChange(thisMonthRevenue, lastMonthRevenue);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Ringkasan hunian, keuangan, dan hal yang butuh perhatian hari ini."
        action={<GenerateBillsButton />}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tingkat hunian"
          value={`${occupancy.toFixed(0)}%`}
          hint={`${occupiedRooms} dari ${totalRooms} kamar terisi`}
          icon={<BedDouble aria-hidden />}
          tone="brand"
        />
        <StatCard
          label="Pemasukan bulan ini"
          value={formatRupiahShort(thisMonthRevenue)}
          icon={<TrendingUp aria-hidden />}
          tone="mint"
          trend={{ value: revenueChange, label: 'vs bulan lalu' }}
        />
        <StatCard
          label="Total tunggakan"
          value={formatRupiahShort(arrears._sum.totalAmount ?? 0)}
          hint={`${arrears._count} tagihan belum lunas`}
          icon={<CircleAlert aria-hidden />}
          tone="peach"
        />
        <StatCard
          label="Komplain aktif"
          value={String(openComplaints)}
          hint={`${pendingRequests} pengajuan menunggu`}
          icon={<MessageSquareWarning aria-hidden />}
          tone="lilac"
        />
      </div>

      <Card className="p-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Pemasukan 12 bulan terakhir</h2>
            <p className="text-[12.5px] text-ink-muted">
              Dihitung dari pembayaran yang sudah terverifikasi.
            </p>
          </div>
          <p className="text-[12.5px] text-ink-muted">
            Total{' '}
            <span className="font-semibold text-ink">
              {formatRupiah(revenueSeries.reduce((sum, point) => sum + point.value, 0))}
            </span>
          </p>
        </div>
        <RevenueChart data={revenueSeries.map(({ label, value }) => ({ label, value }))} />
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink
          href="/kosku/admin/rooms"
          icon={<BedDouble aria-hidden />}
          tone="sky"
          label="Kelola kamar"
          hint={`${availableRooms} kamar kosong`}
        />
        <QuickLink
          href="/kosku/admin/tenants"
          icon={<Users aria-hidden />}
          tone="lilac"
          label="Penghuni aktif"
          hint={`${activeTenants} orang`}
        />
        <QuickLink
          href="/kosku/admin/bills"
          icon={<Receipt aria-hidden />}
          tone="peach"
          label="Tagihan"
          hint={`${arrears._count} belum lunas`}
        />
        <QuickLink
          href="/kosku/admin/requests"
          icon={<Inbox aria-hidden />}
          tone="mint"
          label="Pengajuan"
          hint={`${pendingRequests} menunggu`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Tagihan terbaru</h2>
            <Link
              href="/kosku/admin/bills"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
            >
              Semua
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {recentBills.length === 0 ? (
            <EmptyState
              icon={<Receipt aria-hidden />}
              title="Belum ada tagihan"
              description="Gunakan tombol Generate Tagihan untuk menerbitkan tagihan bulan ini."
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentBills.map((bill) => (
                <li key={bill.id}>
                  <Link
                    href={`/kosku/admin/bills/${bill.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-surface-muted/50"
                  >
                    <IconBox tone="neutral" className="size-9">
                      <Wallet aria-hidden />
                    </IconBox>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">
                        {bill.tenancy.user.fullName}
                      </p>
                      <p className="text-[11.5px] text-ink-muted">
                        Kamar {bill.tenancy.room.number} · {formatPeriod(bill.period)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[13px] font-semibold text-ink">
                        {formatRupiah(bill.totalAmount)}
                      </span>
                      <BillStatusBadge status={bill.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Komplain butuh tindakan</h2>
            <Link
              href="/kosku/admin/complaints"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
            >
              Semua
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {recentComplaints.length === 0 ? (
            <EmptyState
              icon={<MessageSquareWarning aria-hidden />}
              title="Tidak ada komplain aktif"
              description="Semua laporan penghuni sudah tertangani."
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentComplaints.map((complaint) => (
                <li key={complaint.id}>
                  <Link
                    href={`/kosku/admin/complaints?open=${complaint.id}`}
                    className="flex items-start gap-3 px-6 py-3.5 transition hover:bg-surface-muted/50"
                  >
                    <IconBox tone="peach" className="size-9">
                      <MessageSquareWarning aria-hidden />
                    </IconBox>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">
                        {complaint.title}
                      </p>
                      <p className="text-[11.5px] text-ink-muted">
                        {complaint.user.fullName}
                        {complaint.room ? ` · Kamar ${complaint.room.number}` : ''} ·{' '}
                        {formatDateTime(complaint.createdAt)}
                      </p>
                    </div>
                    <ComplaintStatusBadge status={complaint.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  tone,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  tone: 'brand' | 'sky' | 'lilac' | 'peach' | 'mint' | 'neutral';
  label: string;
  hint: string;
}) {
  return (
    <Link href={href}>
      <Card interactive className="flex h-full items-center gap-3.5 p-4">
        <IconBox tone={tone}>{icon}</IconBox>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink">{label}</p>
          <p className="truncate text-[12px] text-ink-muted">{hint}</p>
        </div>
      </Card>
    </Link>
  );
}
