import Link from 'next/link';
import type { BookingStatus, Prisma } from '@prisma/client';
import { CalendarCheck, IdCard, X } from 'lucide-react';

import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { SearchInput } from '@/components/dashboard/search-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { BookingStatusBadge } from '@/components/ui/status';
import { cancelBookingAction } from '@/lib/actions/admin-misc';
import { requireAdmin } from '@/lib/auth';
import { expireStaleBookings } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatDate, formatDateTime, formatPhone, formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Booking masuk' };

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu bayar' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  await requireAdmin();
  await expireStaleBookings();

  const where: Prisma.BookingWhereInput = {};
  if (searchParams.status && TABS.some((tab) => tab.value === searchParams.status && tab.value)) {
    where.status = searchParams.status as BookingStatus;
  }
  if (searchParams.q) {
    where.OR = [
      { user: { fullName: { contains: searchParams.q, mode: 'insensitive' } } },
      { user: { username: { contains: searchParams.q, mode: 'insensitive' } } },
      { room: { number: { contains: searchParams.q, mode: 'insensitive' } } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
          phone: true,
          email: true,
          idCardUrl: true,
          emergencyName: true,
          emergencyPhone: true,
          occupation: true,
        },
      },
      room: { select: { number: true, type: true } },
    },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Booking masuk"
        description="Booking berjalan otomatis: begitu dibayar, kamar langsung aktif tanpa persetujuan."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterTabs tabs={TABS} paramName="status" basePath="/kosku/admin/bookings" />
        <SearchInput placeholder="Cari nama atau kamar..." className="sm:w-64" />
      </div>

      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck aria-hidden />}
            title="Belum ada booking"
            description="Booking dari calon penghuni akan tampil di sini."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[15.5px] font-semibold text-ink">
                      {booking.user.fullName}
                    </h2>
                    <BookingStatusBadge status={booking.status} />
                  </div>

                  <dl className="grid gap-x-8 gap-y-2.5 text-[13px] sm:grid-cols-2">
                    <Row label="Kamar" value={`${booking.room.number} · ${booking.room.type}`} />
                    <Row label="Tanggal masuk" value={formatDate(booking.startDate)} />
                    <Row label="Durasi" value={`${booking.durationMonths} bulan`} />
                    <Row label="Total" value={formatRupiah(booking.totalAmount)} />
                    <Row label="Username" value={`@${booking.user.username}`} />
                    <Row label="No. HP" value={formatPhone(booking.user.phone)} />
                    {booking.user.email ? <Row label="Email" value={booking.user.email} /> : null}
                    {booking.user.occupation ? (
                      <Row label="Pekerjaan" value={booking.user.occupation} />
                    ) : null}
                    {booking.user.emergencyName ? (
                      <Row
                        label="Kontak darurat"
                        value={`${booking.user.emergencyName} · ${booking.user.emergencyPhone ?? '—'}`}
                      />
                    ) : null}
                    <Row label="Dibuat" value={formatDateTime(booking.createdAt)} />
                    {booking.status === 'PENDING' ? (
                      <Row label="Hold sampai" value={formatDateTime(booking.holdUntil)} />
                    ) : null}
                  </dl>

                  {booking.status === 'PENDING' ? (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <Button type="submit" variant="dangerSoft" size="sm">
                        <X aria-hidden />
                        Batalkan booking
                      </Button>
                    </form>
                  ) : null}
                </div>

                <div className="w-full shrink-0 space-y-2 lg:w-56">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted">
                    <IdCard className="size-4" aria-hidden />
                    Foto KTP
                  </p>
                  {booking.user.idCardUrl ? (
                    <a href={booking.user.idCardUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={booking.user.idCardUrl}
                        alt={`KTP ${booking.user.fullName}`}
                        className="w-full rounded-md border border-line object-cover transition hover:opacity-90"
                      />
                    </a>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-line-strong text-[12.5px] text-ink-subtle">
                      Belum diunggah
                    </div>
                  )}
                  <Link
                    href={`/kosku/admin/tenants/${booking.user.id}`}
                    className="block text-center text-[12.5px] font-semibold text-brand hover:underline"
                  >
                    Lihat profil penghuni
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 sm:block">
      <dt className="text-ink-muted sm:text-[11.5px]">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
