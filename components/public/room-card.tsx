import Link from 'next/link';
import type { Room, RoomPhoto } from '@prisma/client';
import { ArrowUpRight, Building2, Maximize } from 'lucide-react';

import { RoomImage } from '@/components/room-image';
import { Card } from '@/components/ui/card';
import { RoomStatusBadge, RoomTypeBadge } from '@/components/ui/status';
import { formatRupiah } from '@/lib/format';

export function RoomCard({ room, held }: { room: Room & { photos: RoomPhoto[] }; held?: boolean }) {
  return (
    <Link href={`/kosku/rooms/${room.id}`} className="group block">
      <Card interactive className="h-full overflow-hidden">
        <div className="relative">
          <RoomImage
            seed={room.number}
            src={room.photos[0]?.url}
            alt={`Kamar ${room.number}`}
            rounded="rounded-none"
            className="aspect-[16/10]"
          />
          <div className="absolute left-4 top-4">
            <RoomStatusBadge status={room.status} held={held} />
          </div>
        </div>

        <div className="space-y-3.5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[15px] font-semibold text-ink">Kamar {room.number}</p>
              <div className="flex items-center gap-3 text-[12.5px] text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" aria-hidden />
                  Lantai {room.floor}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Maximize className="size-3.5" aria-hidden />
                  {room.size}
                </span>
              </div>
            </div>
            <RoomTypeBadge type={room.type} />
          </div>

          {room.facilities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {room.facilities.slice(0, 3).map((facility) => (
                <span
                  key={facility}
                  className="rounded-xs bg-surface-muted px-2 py-1 text-[11.5px] font-medium text-ink-muted"
                >
                  {facility}
                </span>
              ))}
              {room.facilities.length > 3 ? (
                <span className="rounded-xs px-2 py-1 text-[11.5px] font-medium text-ink-subtle">
                  +{room.facilities.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-end justify-between border-t border-line pt-3.5">
            <p className="text-[17px] font-bold text-ink">
              {formatRupiah(room.price)}
              <span className="text-[12.5px] font-medium text-ink-muted">/bulan</span>
            </p>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand">
              Detail
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
