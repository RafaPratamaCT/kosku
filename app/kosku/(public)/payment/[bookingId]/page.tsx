import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

import { QrisPanel } from '@/components/payment/qris-panel';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { requireUser } from '@/lib/auth';
import { expireStaleBookings } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatDate, formatRupiah } from '@/lib/format';
import { ensureBookingCharge } from '@/lib/payment/charges';
import { getSettings, numberSetting } from '@/lib/settings';
import { addMonths } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Pembayaran' };

export default async function PaymentPage({ params }: { params: { bookingId: string } }) {
  const user = await requireUser();
  await expireStaleBookings();

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { room: true },
  });

  if (!booking) notFound();
  // Pemeriksaan kepemilikan: booking hanya bisa dibuka oleh pemiliknya.
  if (booking.userId !== user.id) notFound();

  if (booking.status === 'PAID') redirect('/kosku/tenant');

  if (booking.status !== 'PENDING') {
    return (
      <div className="container flex justify-center py-16">
        <Card className="max-w-md space-y-4 p-8 text-center">
          <h1 className="text-[20px] font-bold text-ink">Booking sudah tidak berlaku</h1>
          <p className="text-[14px] leading-relaxed text-ink-muted">
            Masa hold kamar {booking.room.number} sudah habis dan kamar dilepas kembali. Silakan
            pilih kamar lagi.
          </p>
          <ButtonLink href="/kosku/rooms" className="block w-full">
            Lihat kamar tersedia
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const [charge, settings] = await Promise.all([ensureBookingCharge(booking), getSettings()]);
  const deposit = numberSetting(settings.depositAmount, 0);
  const endDate = addMonths(booking.startDate, booking.durationMonths);

  return (
    <div className="container py-10 sm:py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-[26px] font-bold leading-tight text-ink sm:text-[32px]">
            Selesaikan pembayaran
          </h1>
          <p className="text-[14.5px] text-ink-muted">
            Setelah pembayaran berhasil, kamar langsung aktif — tanpa menunggu persetujuan admin.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-4">
            <Card className="space-y-5 p-6">
              <h2 className="text-[16px] font-semibold text-ink">Ringkasan booking</h2>

              <div className="space-y-2.5 text-[13.5px]">
                <Row label="Kamar" value={`Kamar ${booking.room.number}`} />
                <Row label="Tipe" value={booking.room.type} />
                <Row label="Tanggal masuk" value={formatDate(booking.startDate)} />
                <Row label="Sampai" value={formatDate(endDate)} />
                <Row label="Durasi" value={`${booking.durationMonths} bulan`} />
              </div>

              <div className="space-y-2.5 border-t border-line pt-4 text-[13.5px]">
                <Row
                  label={`Sewa ${formatRupiah(booking.room.price)} × ${booking.durationMonths}`}
                  value={formatRupiah(booking.room.price * booking.durationMonths)}
                />
                <Row label="Deposit" value={formatRupiah(deposit)} />
              </div>

              <div className="flex items-end justify-between border-t border-line pt-4">
                <span className="text-[13.5px] font-medium text-ink">Total</span>
                <span className="text-[22px] font-bold text-ink">
                  {formatRupiah(booking.totalAmount)}
                </span>
              </div>
            </Card>

            <Card className="space-y-3 p-6">
              <p className="text-[14px] font-semibold text-ink">Setelah pembayaran berhasil</p>
              <ul className="space-y-2.5 text-[13px] text-ink-muted">
                {[
                  'Kamar berubah status menjadi terisi atas nama Anda',
                  'Akun Anda otomatis menjadi akun penghuni',
                  'Tagihan sewa tercatat lunas dan kwitansi bisa diunduh',
                  'Dashboard penghuni langsung bisa dibuka',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <QrisPanel
            qrImageDataUrl={charge.qrImageDataUrl}
            reference={charge.reference}
            amount={charge.amount}
            expiresAt={booking.holdUntil.toISOString()}
            description={`Kamar ${booking.room.number} · ${booking.durationMonths} bulan`}
            onExpiredHref="/kosku/rooms"
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
