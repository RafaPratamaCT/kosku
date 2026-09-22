import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { RoomForm } from '@/components/admin/room-form';
import { LockToggleButton, MaintenanceToggle } from '@/components/admin/room-status-control';
import { RoomImage } from '@/components/room-image';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { Alert, EmptyState } from '@/components/ui/misc';
import { RoomStatusBadge, TenancyStatusBadge } from '@/components/ui/status';
import { deleteRoomPhotoAction } from '@/lib/actions/admin-rooms';
import { requireAdmin } from '@/lib/auth';
import { heldRoomIds } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatDate, formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Edit kamar' };

export default async function AdminRoomDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  await requireAdmin();

  const [room, held] = await Promise.all([
    prisma.room.findUnique({
      where: { id: params.id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        tenancies: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, fullName: true, phone: true } } },
        },
      },
    }),
    heldRoomIds(),
  ]);

  if (!room) notFound();

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link
          href="/kosku/admin/rooms"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar kamar
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-bold leading-tight text-ink">Kamar {room.number}</h1>
              <RoomStatusBadge status={room.status} held={held.has(room.id)} />
            </div>
            <p className="text-[13.5px] text-ink-muted">
              Lantai {room.floor} · {room.size} · {formatRupiah(room.price)}/bulan
            </p>
          </div>

          <ButtonLink
            href={`/kosku/rooms/${room.id}`}
            variant="outline"
            className="shrink-0"
            target="_blank"
          >
            Lihat di halaman publik
          </ButtonLink>
        </div>
      </div>

      {searchParams.created ? (
        <Alert tone="success" title="Kamar berhasil ditambahkan">
          Kamar ini sudah muncul di halaman publik dan siap dibooking.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <Card className="p-6 sm:p-8">
          <h2 className="mb-6 text-[15px] font-semibold text-ink">Data kamar</h2>
          <RoomForm
            values={{
              id: room.id,
              number: room.number,
              type: room.type,
              floor: room.floor,
              price: room.price,
              size: room.size,
              description: room.description,
              facilities: room.facilities,
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <h2 className="text-[15px] font-semibold text-ink">Status kamar</h2>
            <div className="space-y-3">
              <LockToggleButton roomId={room.id} status={room.status} size="md" />
              <MaintenanceToggle roomId={room.id} status={room.status} />
            </div>
            {room.status === 'OCCUPIED' ? (
              <p className="text-[12.5px] leading-relaxed text-ink-muted">
                Kamar sedang ditempati. Proses check-out penghuni dulu dari halaman Penghuni sebelum
                mengubah status.
              </p>
            ) : null}
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-[15px] font-semibold text-ink">Foto kamar</h2>
            {room.photos.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Belum ada foto. Unggah lewat formulir di sebelah kiri — sebelum ada foto, halaman
                publik memakai ilustrasi bawaan.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {room.photos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    <RoomImage
                      seed={room.number}
                      src={photo.url}
                      alt={`Foto kamar ${room.number}`}
                      rounded="rounded-md"
                      className="aspect-[4/3]"
                    />
                    <form action={deleteRoomPhotoAction} className="absolute right-2 top-2">
                      <input type="hidden" name="photoId" value={photo.id} />
                      <button
                        type="submit"
                        aria-label="Hapus foto"
                        className="flex size-7 items-center justify-center rounded-xs bg-surface/90 text-danger opacity-0 shadow-xs backdrop-blur transition group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-[15px] font-semibold text-ink">Riwayat penghuni</h2>
        </div>
        {room.tenancies.length === 0 ? (
          <EmptyState
            title="Belum pernah ditempati"
            description="Riwayat penghuni kamar ini akan tercatat di sini."
          />
        ) : (
          <ul className="divide-y divide-line">
            {room.tenancies.map((tenancy) => (
              <li
                key={tenancy.id}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/kosku/admin/tenants/${tenancy.user.id}`}
                    className="text-[13.5px] font-semibold text-ink hover:underline"
                  >
                    {tenancy.user.fullName}
                  </Link>
                  <p className="text-[12px] text-ink-muted">
                    {formatDate(tenancy.startDate)} – {formatDate(tenancy.endDate)} ·{' '}
                    {formatRupiah(tenancy.monthlyPrice)}/bulan
                  </p>
                </div>
                <TenancyStatusBadge status={tenancy.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
