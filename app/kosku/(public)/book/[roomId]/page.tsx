import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { BookingForm } from '@/components/public/booking-form';
import { RoomImage } from '@/components/room-image';
import { Card } from '@/components/ui/card';
import { RoomTypeBadge } from '@/components/ui/status';
import { getCurrentUser } from '@/lib/auth';
import { expireStaleBookings, heldRoomIds } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatRupiah } from '@/lib/format';
import { getSettings, numberSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Booking kamar' };

function toInputDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export default async function BookRoomPage({ params }: { params: { roomId: string } }) {
  await expireStaleBookings();

  const [room, settings, held, user] = await Promise.all([
    prisma.room.findUnique({
      where: { id: params.roomId },
      include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
    }),
    getSettings(),
    heldRoomIds(),
    getCurrentUser(),
  ]);

  if (!room) notFound();
  if (room.status !== 'AVAILABLE' || held.has(room.id)) {
    redirect(`/kosku/rooms/${room.id}`);
  }

  const today = new Date();
  const deposit = numberSetting(settings.depositAmount, 0);

  return (
    <div className="container space-y-8 py-10 sm:py-14">
      <div className="space-y-4">
        <Link
          href={`/kosku/rooms/${room.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke detail kamar
        </Link>

        <div className="space-y-2">
          <h1 className="text-[26px] font-bold leading-tight text-ink sm:text-[32px]">
            Booking Kamar {room.number}
          </h1>
          <p className="text-[14.5px] text-ink-muted">
            Tinggal tiga langkah: atur jadwal, buat akun, lalu bayar.
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <RoomImage
          seed={room.number}
          src={room.photos[0]?.url}
          alt={`Kamar ${room.number}`}
          rounded="rounded-xl"
          className="aspect-[16/10] w-full sm:w-44"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-semibold text-ink">Kamar {room.number}</p>
            <RoomTypeBadge type={room.type} />
          </div>
          <p className="text-[13px] text-ink-muted">
            Lantai {room.floor} · {room.size}
            {room.facilities.length > 0 ? ` · ${room.facilities.slice(0, 3).join(', ')}` : ''}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[12px] text-ink-muted">Harga sewa</p>
          <p className="text-[18px] font-bold text-ink">
            {formatRupiah(room.price)}
            <span className="text-[12px] font-medium text-ink-muted">/bulan</span>
          </p>
        </div>
      </Card>

      <BookingForm
        roomId={room.id}
        monthlyPrice={room.price}
        depositAmount={deposit}
        minDate={toInputDate(today)}
        defaultDate={toInputDate(today)}
        isLoggedIn={Boolean(user && user.role === 'TENANT')}
      />
    </div>
  );
}
