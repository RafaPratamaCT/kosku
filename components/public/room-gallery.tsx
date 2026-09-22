'use client';

import * as React from 'react';

import { RoomImage } from '@/components/room-image';
import { cn } from '@/lib/utils';

export function RoomGallery({
  seed,
  photos,
  roomNumber,
}: {
  seed: string;
  photos: string[];
  roomNumber: string;
}) {
  const slides = photos.length > 0 ? photos : [null, null, null];
  const [active, setActive] = React.useState(0);

  return (
    <div className="space-y-3">
      <RoomImage
        seed={`${seed}-${active}`}
        src={slides[active] ?? undefined}
        alt={`Foto kamar ${roomNumber}`}
        rounded="rounded-2xl"
        className="aspect-[16/10] w-full shadow-soft"
      />
      {slides.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {slides.map((photo, index) => (
            <button
              key={`${photo ?? 'placeholder'}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Lihat foto ${index + 1}`}
              className={cn(
                'overflow-hidden rounded-md transition-all duration-200',
                active === index
                  ? 'ring-2 ring-brand ring-offset-2 ring-offset-canvas'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <RoomImage
                seed={`${seed}-${index}`}
                src={photo ?? undefined}
                alt=""
                rounded="rounded-none"
                className="aspect-[4/3]"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
