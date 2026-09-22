import Link from 'next/link';
import type { Prisma, RoomStatus } from '@prisma/client';
import { BedDouble, Pencil, Plus } from 'lucide-react';

import { LockToggleButton } from '@/components/admin/room-status-control';
import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { SearchInput } from '@/components/dashboard/search-input';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { RoomStatusBadge, RoomTypeBadge } from '@/components/ui/status';
import { Table, TableScroll, TableWrap, Td, Th, Tr } from '@/components/ui/table';
import { requireAdmin } from '@/lib/auth';
import { expireStaleBookings, heldRoomIds } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Kelola kamar' };

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'AVAILABLE', label: 'Tersedia' },
  { value: 'OCCUPIED', label: 'Terisi' },
  { value: 'LOCKED', label: 'Terkunci' },
  { value: 'MAINTENANCE', label: 'Perbaikan' },
];

export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  await requireAdmin();
  await expireStaleBookings();

  const where: Prisma.RoomWhereInput = {};
  if (searchParams.status && TABS.some((tab) => tab.value === searchParams.status && tab.value)) {
    where.status = searchParams.status as RoomStatus;
  }
  if (searchParams.q) {
    where.OR = [
      { number: { contains: searchParams.q, mode: 'insensitive' } },
      { description: { contains: searchParams.q, mode: 'insensitive' } },
    ];
  }

  const [rooms, held, counts] = await Promise.all([
    prisma.room.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      include: {
        tenancies: {
          where: { status: 'ACTIVE' },
          select: { user: { select: { id: true, fullName: true } } },
          take: 1,
        },
      },
    }),
    heldRoomIds(),
    prisma.room.groupBy({ by: ['status'], _count: true }),
  ]);

  const countOf = (status: string) => counts.find((item) => item.status === status)?._count ?? 0;

  const tabs = TABS.map((tab) => ({
    ...tab,
    count: tab.value ? countOf(tab.value) : counts.reduce((sum, item) => sum + item._count, 0),
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        title="Kelola kamar"
        description="Atur data kamar, kunci kamar agar tidak bisa dibooking, atau tandai sedang diperbaiki."
        action={
          <ButtonLink href="/kosku/admin/rooms/new">
            <Plus aria-hidden />
            Tambah kamar
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterTabs tabs={tabs} paramName="status" basePath="/kosku/admin/rooms" />
        <SearchInput placeholder="Cari nomor kamar..." className="sm:w-64" />
      </div>

      {rooms.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BedDouble aria-hidden />}
            title="Tidak ada kamar"
            description="Coba ubah filter, atau tambahkan kamar baru."
            action={<ButtonLink href="/kosku/admin/rooms/new">Tambah kamar</ButtonLink>}
          />
        </Card>
      ) : (
        <TableWrap>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Kamar</Th>
                  <Th>Tipe</Th>
                  <Th>Lantai</Th>
                  <Th className="text-right">Harga</Th>
                  <Th>Status</Th>
                  <Th>Penghuni</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const tenant = room.tenancies[0]?.user;
                  return (
                    <Tr key={room.id}>
                      <Td className="font-semibold text-ink">{room.number}</Td>
                      <Td>
                        <RoomTypeBadge type={room.type} />
                      </Td>
                      <Td className="text-ink-muted">{room.floor}</Td>
                      <Td className="whitespace-nowrap text-right font-medium text-ink">
                        {formatRupiah(room.price)}
                      </Td>
                      <Td>
                        <RoomStatusBadge status={room.status} held={held.has(room.id)} />
                        {room.lockReason ? (
                          <p className="mt-1 max-w-[220px] text-[11.5px] text-ink-subtle">
                            {room.lockReason}
                          </p>
                        ) : null}
                      </Td>
                      <Td className="text-ink-muted">
                        {tenant ? (
                          <Link
                            href={`/kosku/admin/tenants/${tenant.id}`}
                            className="font-medium text-ink hover:underline"
                          >
                            {tenant.fullName}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <LockToggleButton roomId={room.id} status={room.status} />
                          <ButtonLink
                            href={`/kosku/admin/rooms/${room.id}`}
                            variant="ghost"
                            size="iconSm"
                            aria-label="Edit kamar"
                          >
                            <Pencil aria-hidden />
                          </ButtonLink>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        </TableWrap>
      )}
    </div>
  );
}
