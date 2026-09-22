import type { Metadata } from 'next';
import Link from 'next/link';
import { BedDouble } from 'lucide-react';

import { RegisterForm } from '@/components/auth/register-form';
import { Card } from '@/components/ui/card';
import { IconBox } from '@/components/ui/misc';
import { prisma } from '@/lib/db';
import { formatDate, formatRupiah } from '@/lib/format';
import { getSettings, numberSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Daftar akun' };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const next = first(searchParams.next);
  const roomId = first(searchParams.roomId);
  const startDate = first(searchParams.startDate);
  const durationMonths = first(searchParams.durationMonths);

  const booking =
    roomId && startDate && durationMonths ? { roomId, startDate, durationMonths } : undefined;

  const [room, settings] = await Promise.all([
    booking
      ? prisma.room.findUnique({
          where: { id: booking.roomId },
          select: { number: true, price: true, size: true, type: true },
        })
      : Promise.resolve(null),
    getSettings(),
  ]);

  const duration = booking ? Number(booking.durationMonths) : 0;
  const deposit = numberSetting(settings.depositAmount, 0);
  const total = room ? room.price * duration + deposit : 0;

  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="max-w-xl space-y-2">
          <h1 className="text-[26px] font-bold leading-tight text-ink sm:text-[32px]">
            Daftar akun penghuni
          </h1>
          <p className="text-[14.5px] leading-relaxed text-ink-muted">
            Akun ini dipakai untuk membayar tagihan, mengirim komplain, dan mengurus pengajuan
            selama tinggal di kos.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <Card className="p-6 sm:p-8">
            <RegisterForm next={next} booking={booking} />
          </Card>

          <div className="space-y-4 lg:sticky lg:top-24">
            {room && booking ? (
              <Card className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <IconBox tone="brand">
                    <BedDouble aria-hidden />
                  </IconBox>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">Kamar {room.number}</p>
                    <p className="text-[12.5px] text-ink-muted">{room.size}</p>
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-line pt-4 text-[13px]">
                  <Row
                    label="Tanggal masuk"
                    value={formatDate(new Date(`${booking.startDate}T00:00:00`))}
                  />
                  <Row label="Durasi" value={`${duration} bulan`} />
                  <Row label="Sewa" value={`${formatRupiah(room.price)} × ${duration}`} />
                  <Row label="Deposit" value={formatRupiah(deposit)} />
                </div>

                <div className="flex items-end justify-between border-t border-line pt-4">
                  <span className="text-[13px] font-medium text-ink">Total bayar</span>
                  <span className="text-[19px] font-bold text-ink">{formatRupiah(total)}</span>
                </div>
              </Card>
            ) : (
              <Card className="space-y-3 p-6">
                <p className="text-[14px] font-semibold text-ink">Belum pilih kamar?</p>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  Anda tetap bisa membuat akun lebih dulu, lalu memilih kamar kapan saja.
                </p>
                <Link
                  href="/kosku/rooms"
                  className="inline-block text-[13px] font-semibold text-brand hover:underline"
                >
                  Lihat daftar kamar
                </Link>
              </Card>
            )}

            <p className="px-1 text-center text-[13px] text-ink-muted">
              Sudah punya akun?{' '}
              <Link
                href={
                  booking
                    ? `/kosku/login?roomId=${booking.roomId}&startDate=${booking.startDate}&durationMonths=${booking.durationMonths}`
                    : '/kosku/login'
                }
                className="font-semibold text-brand hover:underline"
              >
                Masuk
              </Link>
            </p>
          </div>
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
