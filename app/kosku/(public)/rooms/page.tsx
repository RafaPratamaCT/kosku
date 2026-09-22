import type { Metadata } from 'next';
import type { Prisma, RoomType } from '@prisma/client';
import { DoorClosed } from 'lucide-react';

import { RoomCard } from '@/components/public/room-card';
import { RoomFilters } from '@/components/public/room-filters';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Card } from '@/components/ui/card';
import { expireStaleBookings, heldRoomIds } from '@/lib/bookings';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Daftar kamar',
  description: 'Lihat semua kamar, filter sesuai kebutuhan, dan booking langsung online.',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function many(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function RoomsPage({ searchParams }: { searchParams: SearchParams }) {
  // Booking yang kedaluwarsa dibereskan setiap kali daftar kamar dibuka.
  await expireStaleBookings();

  const type = first(searchParams.type);
  const floor = first(searchParams.floor);
  const price = first(searchParams.price);
  const status = first(searchParams.status);
  const sort = first(searchParams.sort) ?? 'price-asc';
  const facilities = many(searchParams.fasilitas);

  const where: Prisma.RoomWhereInput = {};
  if (type && ['STANDARD', 'DELUXE', 'VIP'].includes(type)) {
    where.type = type as RoomType;
  }
  if (floor && Number.isFinite(Number(floor))) {
    where.floor = Number(floor);
  }
  if (status === 'AVAILABLE') {
    where.status = 'AVAILABLE';
  }
  if (price) {
    const [min, max] = price.split('-').map(Number);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      where.price = { gte: min, lte: max };
    }
  }
  if (facilities.length > 0) {
    where.facilities = { hasEvery: facilities };
  }

  const orderBy: Prisma.RoomOrderByWithRelationInput =
    sort === 'price-desc'
      ? { price: 'desc' }
      : sort === 'number-asc'
        ? { number: 'asc' }
        : sort === 'floor-asc'
          ? { floor: 'asc' }
          : { price: 'asc' };

  const [rooms, allRooms, held, availableCount, totalCount] = await Promise.all([
    prisma.room.findMany({
      where,
      orderBy: [orderBy, { number: 'asc' }],
      include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
    }),
    prisma.room.findMany({ select: { floor: true, facilities: true, price: true } }),
    heldRoomIds(),
    prisma.room.count({ where: { status: 'AVAILABLE' } }),
    prisma.room.count(),
  ]);

  const floors = Array.from(new Set(allRooms.map((room) => room.floor))).sort((a, b) => a - b);
  const facilityOptions = Array.from(new Set(allRooms.flatMap((room) => room.facilities))).sort(
    (a, b) => a.localeCompare(b, 'id'),
  );
  const maxPrice = allRooms.reduce((max, room) => Math.max(max, room.price), 0);

  return (
    <div className="container space-y-8 py-10 sm:py-14">
      <PageHeader
        title="Daftar kamar"
        description={`${availableCount} dari ${totalCount} kamar tersedia. Pilih yang paling cocok, lalu booking langsung dari halaman detail.`}
      />

      <RoomFilters options={{ floors, facilities: facilityOptions, maxPrice }} />

      {rooms.length === 0 ? (
        <Card>
          <EmptyState
            icon={<DoorClosed aria-hidden />}
            title="Tidak ada kamar yang cocok"
            description="Coba longgarkan filternya — misalnya hapus batasan harga atau fasilitas."
          />
        </Card>
      ) : (
        <>
          <p className="text-[13px] text-ink-muted">Menampilkan {rooms.length} kamar</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} held={held.has(room.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
