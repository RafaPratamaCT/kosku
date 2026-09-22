import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, Check, Lock, Maximize, Wrench } from 'lucide-react';

import { RoomGallery } from '@/components/public/room-gallery';
import { Alert } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { RoomStatusBadge, RoomTypeBadge } from '@/components/ui/status';
import { expireStaleBookings, heldRoomIds } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatRupiah } from '@/lib/format';
import { getSettings, numberSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const room = await prisma.room.findUnique({
    where: { id: params.id },
    select: { number: true, size: true },
  });
  if (!room) return { title: 'Kamar tidak ditemukan' };
  return {
    title: `Kamar ${room.number}`,
    description: `Kamar ${room.number} berukuran ${room.size}. Lihat fasilitas dan booking online.`,
  };
}

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
  await expireStaleBookings();

  const [room, settings, held] = await Promise.all([
    prisma.room.findUnique({
      where: { id: params.id },
      include: { photos: { orderBy: { order: 'asc' } } },
    }),
    getSettings(),
    heldRoomIds(),
  ]);

  if (!room) notFound();

  const isHeld = held.has(room.id);
  const deposit = numberSetting(settings.depositAmount, 0);
  const bookable = room.status === 'AVAILABLE' && !isHeld;

  const otherRooms = await prisma.room.findMany({
    where: { id: { not: room.id }, status: 'AVAILABLE' },
    orderBy: { price: 'asc' },
    take: 3,
    select: { id: true, number: true, price: true, type: true, size: true },
  });

  return (
    <div className="container space-y-10 py-8 sm:py-12">
      <Link
        href="/kosku/rooms"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke daftar kamar
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="space-y-8">
          <RoomGallery
            seed={room.number}
            roomNumber={room.number}
            photos={room.photos.map((photo) => photo.url)}
          />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <RoomTypeBadge type={room.type} />
              <RoomStatusBadge status={room.status} held={isHeld} />
            </div>
            <h1 className="text-[28px] font-bold leading-tight text-ink sm:text-[34px]">
              Kamar {room.number}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-[13.5px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" aria-hidden />
                Lantai {room.floor}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Maximize className="size-4" aria-hidden />
                Ukuran {room.size}
              </span>
            </div>
          </div>

          {room.description ? (
            <div className="space-y-3">
              <h2 className="text-[17px] font-semibold text-ink">Tentang kamar ini</h2>
              <p className="max-w-2xl whitespace-pre-line text-[14.5px] leading-relaxed text-ink-muted">
                {room.description}
              </p>
            </div>
          ) : null}

          {room.facilities.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-[17px] font-semibold text-ink">Fasilitas kamar</h2>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {room.facilities.map((facility) => (
                  <li
                    key={facility}
                    className="flex items-center gap-2.5 rounded-md bg-surface px-4 py-3 text-[13.5px] text-ink shadow-xs"
                  >
                    <Check className="size-4 shrink-0 text-brand" aria-hidden />
                    {facility}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Panel booking */}
        <div className="lg:sticky lg:top-24">
          <Card className="space-y-5 p-6">
            <div>
              <p className="text-[12.5px] text-ink-muted">Harga sewa</p>
              <p className="mt-1 text-[28px] font-bold leading-none text-ink">
                {formatRupiah(room.price)}
                <span className="text-[13px] font-medium text-ink-muted"> /bulan</span>
              </p>
            </div>

            <div className="space-y-2.5 border-y border-line py-4 text-[13.5px]">
              <Row label="Deposit" value={formatRupiah(deposit)} />
              <Row label="Check-in" value={`Pukul ${settings.checkInTime}`} />
              <Row label="Check-out" value={`Pukul ${settings.checkOutTime}`} />
              <Row
                label="Masa hold"
                value={`${numberSetting(settings.bookingHoldMinutes, 30)} menit`}
              />
            </div>

            {bookable ? (
              <>
                <ButtonLink href={`/kosku/book/${room.id}`} size="lg" className="block w-full">
                  Booking Sekarang
                </ButtonLink>
                <p className="text-center text-[12px] leading-relaxed text-ink-subtle">
                  Kamar dikunci untuk Anda selama proses pembayaran. Tidak perlu menunggu
                  persetujuan admin.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                {isHeld ? (
                  <Alert tone="warn" title="Sedang dipesan orang lain">
                    Kamar ini dikunci sementara. Coba cek lagi beberapa menit ke depan.
                  </Alert>
                ) : room.status === 'OCCUPIED' ? (
                  <Alert tone="info" title="Kamar sedang terisi">
                    Hubungi pemilik kos untuk masuk daftar tunggu kamar ini.
                  </Alert>
                ) : room.status === 'MAINTENANCE' ? (
                  <Alert tone="warn" title="Sedang diperbaiki">
                    <span className="inline-flex items-center gap-1.5">
                      <Wrench className="size-3.5" aria-hidden />
                      {room.lockReason || 'Kamar sedang dalam perbaikan.'}
                    </span>
                  </Alert>
                ) : (
                  <Alert tone="danger" title="Kamar dikunci">
                    <span className="inline-flex items-center gap-1.5">
                      <Lock className="size-3.5" aria-hidden />
                      {room.lockReason || 'Kamar tidak dibuka untuk booking saat ini.'}
                    </span>
                  </Alert>
                )}
                <ButtonLink href="/kosku/rooms" variant="outline" className="block w-full">
                  Lihat kamar lain
                </ButtonLink>
              </div>
            )}
          </Card>

          {otherRooms.length > 0 ? (
            <div className="mt-6 space-y-3">
              <p className="px-1 text-[13px] font-semibold text-ink">Kamar lain yang tersedia</p>
              <div className="space-y-2">
                {otherRooms.map((other) => (
                  <Link key={other.id} href={`/kosku/rooms/${other.id}`} className="block">
                    <div className="flex items-center justify-between gap-3 rounded-md bg-surface px-4 py-3.5 shadow-xs transition hover:shadow-soft">
                      <div>
                        <p className="text-[13.5px] font-semibold text-ink">Kamar {other.number}</p>
                        <p className="text-[12px] text-ink-muted">{other.size}</p>
                      </div>
                      <p className="text-[13.5px] font-semibold text-ink">
                        {formatRupiah(other.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
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
