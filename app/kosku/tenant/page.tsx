import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  CalendarClock,
  FileText,
  Inbox,
  Megaphone,
  MessageSquareWarning,
  Receipt,
  Wallet,
} from 'lucide-react';

import { RoomImage } from '@/components/room-image';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { Alert, EmptyState, IconBox, PageHeader } from '@/components/ui/misc';
import { BillStatusBadge, RoomTypeBadge } from '@/components/ui/status';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPeriod, formatRelativeDays, formatRupiah } from '@/lib/format';
import { getActiveTenancy } from '@/lib/tenant';
import { daysBetween } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Beranda penghuni' };

const QUICK_ACTIONS = [
  {
    href: '/kosku/tenant/bills',
    label: 'Bayar tagihan',
    description: 'QRIS atau transfer',
    icon: Receipt,
    tone: 'brand' as const,
  },
  {
    href: '/kosku/tenant/complaints/new',
    label: 'Kirim komplain',
    description: 'Ada yang rusak?',
    icon: MessageSquareWarning,
    tone: 'peach' as const,
  },
  {
    href: '/kosku/tenant/requests/new',
    label: 'Buat pengajuan',
    description: 'Perpanjang, tamu, dll.',
    icon: Inbox,
    tone: 'lilac' as const,
  },
  {
    href: '/kosku/tenant/documents',
    label: 'Lihat dokumen',
    description: 'Kontrak & aturan',
    icon: FileText,
    tone: 'sky' as const,
  },
];

export default async function TenantHomePage() {
  const user = await requireTenant();
  const tenancy = await getActiveTenancy(user.id);

  const [nextBill, unpaidTotal, announcements, recentPayments] = await Promise.all([
    prisma.bill.findFirst({
      where: {
        tenancy: { userId: user.id },
        status: { in: ['UNPAID', 'OVERDUE', 'WAITING_VERIFICATION'] },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.bill.aggregate({
      where: { tenancy: { userId: user.id }, status: { in: ['UNPAID', 'OVERDUE'] } },
      _sum: { totalAmount: true },
    }),
    prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
    prisma.payment.findMany({
      where: { bill: { tenancy: { userId: user.id } }, status: 'VERIFIED' },
      orderBy: { paidAt: 'desc' },
      take: 3,
      include: { bill: { select: { period: true } } },
    }),
  ]);

  if (!tenancy) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Halo, ${user.fullName.split(' ')[0]}`}
          description="Akun Anda aktif, tetapi belum ada kamar yang tercatat atas nama Anda."
        />
        <Card>
          <EmptyState
            icon={<BedDouble aria-hidden />}
            title="Belum ada kamar aktif"
            description="Pilih kamar yang tersedia lalu selesaikan pembayaran untuk mulai menempati kos."
            action={<ButtonLink href="/kosku/rooms">Lihat kamar tersedia</ButtonLink>}
          />
        </Card>
      </div>
    );
  }

  const daysLeft = daysBetween(new Date(), tenancy.endDate);
  const totalDays = daysBetween(tenancy.startDate, tenancy.endDate);
  const progress = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));
  const unpaid = unpaidTotal._sum.totalAmount ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Halo, ${user.fullName.split(' ')[0]}`}
        description="Ini ringkasan kos Anda hari ini."
      />

      {nextBill && nextBill.status === 'OVERDUE' ? (
        <Alert tone="danger" title="Ada tagihan yang telat">
          Tagihan {formatPeriod(nextBill.period)} sudah lewat jatuh tempo{' '}
          {formatRelativeDays(daysBetween(new Date(), nextBill.dueDate))}. Segera lakukan pembayaran
          agar denda tidak bertambah.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {/* Kartu kamar */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-5 p-6 sm:flex-row">
            <RoomImage
              seed={tenancy.room.number}
              src={tenancy.room.photos[0]?.url}
              alt={`Kamar ${tenancy.room.number}`}
              rounded="rounded-xl"
              className="aspect-[16/10] w-full shrink-0 sm:w-52"
            />

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[19px] font-bold text-ink">Kamar {tenancy.room.number}</h2>
                  <RoomTypeBadge type={tenancy.room.type} />
                </div>
                <p className="text-[13px] text-ink-muted">
                  Lantai {tenancy.room.floor} · {tenancy.room.size} ·{' '}
                  {formatRupiah(tenancy.monthlyPrice)}/bulan
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink-muted">Masa sewa</span>
                  <span className="font-semibold text-ink">
                    {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Sudah berakhir'}
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progres masa sewa"
                >
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-ink-subtle">
                  <span>{formatDate(tenancy.startDate)}</span>
                  <span>{formatDate(tenancy.endDate)}</span>
                </div>
              </div>

              {tenancy.room.facilities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tenancy.room.facilities.slice(0, 5).map((facility) => (
                    <span
                      key={facility}
                      className="rounded-xs bg-surface-muted px-2 py-1 text-[11.5px] font-medium text-ink-muted"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              ) : null}

              {daysLeft <= 30 && daysLeft > 0 ? (
                <Link
                  href="/kosku/tenant/requests/new?type=EXTEND"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
                >
                  <CalendarClock className="size-3.5" aria-hidden />
                  Ajukan perpanjangan sewa
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Tagihan terdekat */}
        <Card className="flex flex-col justify-between p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[12.5px] font-medium text-ink-muted">Tagihan terdekat</p>
                {nextBill ? (
                  <p className="text-[24px] font-bold leading-none text-ink">
                    {formatRupiah(nextBill.totalAmount)}
                  </p>
                ) : (
                  <p className="text-[18px] font-bold leading-none text-brand-ink">Semua lunas</p>
                )}
              </div>
              <IconBox tone={nextBill ? 'peach' : 'mint'}>
                <Wallet aria-hidden />
              </IconBox>
            </div>

            {nextBill ? (
              <div className="space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Periode</span>
                  <span className="font-medium text-ink">{formatPeriod(nextBill.period)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Jatuh tempo</span>
                  <span className="font-medium text-ink">{formatDate(nextBill.dueDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Status</span>
                  <BillStatusBadge status={nextBill.status} />
                </div>
              </div>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Tidak ada tagihan yang menunggu pembayaran. Tagihan berikutnya akan muncul otomatis
                pada awal periode.
              </p>
            )}
          </div>

          <div className="mt-5">
            {nextBill ? (
              <ButtonLink href={`/kosku/tenant/bills/${nextBill.id}`} className="block w-full">
                Bayar sekarang
              </ButtonLink>
            ) : (
              <ButtonLink href="/kosku/tenant/bills" variant="outline" className="block w-full">
                Lihat semua tagihan
              </ButtonLink>
            )}
            {unpaid > 0 ? (
              <p className="mt-3 text-center text-[12px] text-ink-muted">
                Total tunggakan {formatRupiah(unpaid)}
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Aksi cepat */}
      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-ink">Aksi cepat</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card interactive className="flex h-full items-center gap-3.5 p-4">
                <IconBox tone={action.tone}>
                  <action.icon aria-hidden />
                </IconBox>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{action.label}</p>
                  <p className="truncate text-[12px] text-ink-muted">{action.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pengumuman */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Pengumuman terbaru</h2>
            <Link
              href="/kosku/tenant/announcements"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
            >
              Semua
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {announcements.length === 0 ? (
            <EmptyState
              icon={<Megaphone aria-hidden />}
              title="Belum ada pengumuman"
              description="Pengumuman dari pemilik kos akan tampil di sini."
            />
          ) : (
            <ul className="divide-y divide-line">
              {announcements.map((item) => (
                <li key={item.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <IconBox tone={item.isPinned ? 'peach' : 'neutral'} className="size-9">
                      <Megaphone aria-hidden />
                    </IconBox>
                    <div className="min-w-0 space-y-1">
                      <p className="text-[13.5px] font-semibold text-ink">{item.title}</p>
                      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
                        {item.content}
                      </p>
                      <p className="text-[11.5px] text-ink-subtle">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Pembayaran terakhir */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Pembayaran terakhir</h2>
            <Link
              href="/kosku/tenant/payments"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
            >
              Semua
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <EmptyState
              icon={<Wallet aria-hidden />}
              title="Belum ada pembayaran"
              description="Riwayat pembayaran Anda akan tercatat di sini."
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentPayments.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 px-6 py-4">
                  <IconBox tone="mint" className="size-9">
                    <Wallet aria-hidden />
                  </IconBox>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {payment.bill ? formatPeriod(payment.bill.period) : 'Pembayaran'}
                    </p>
                    <p className="text-[11.5px] text-ink-muted">
                      {payment.paidAt ? formatDate(payment.paidAt) : '—'}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13.5px] font-semibold text-ink">
                    {formatRupiah(payment.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
