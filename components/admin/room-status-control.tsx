'use client';

import * as React from 'react';
import type { RoomStatus } from '@prisma/client';
import { Lock, LockOpen, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { setRoomStatusAction, toggleRoomLockAction } from '@/lib/actions/admin-rooms';

export function LockToggleButton({
  roomId,
  status,
  size = 'sm',
}: {
  roomId: string;
  status: RoomStatus;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = React.useState(false);

  if (status === 'OCCUPIED') {
    return <span className="text-[12.5px] text-ink-subtle">Sedang terisi</span>;
  }

  if (status === 'LOCKED') {
    return (
      <form action={toggleRoomLockAction}>
        <input type="hidden" name="roomId" value={roomId} />
        <Button type="submit" variant="soft" size={size}>
          <LockOpen aria-hidden />
          Buka kunci
        </Button>
      </form>
    );
  }

  return open ? (
    <form action={toggleRoomLockAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="roomId" value={roomId} />
      <Input
        name="lockReason"
        placeholder="Alasan dikunci"
        className="h-9 w-48 text-[13px]"
        autoFocus
      />
      <Button type="submit" size="sm" variant="danger">
        Kunci
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Batal
      </Button>
    </form>
  ) : (
    <Button variant="outline" size={size} onClick={() => setOpen(true)}>
      <Lock aria-hidden />
      Kunci kamar
    </Button>
  );
}

export function MaintenanceToggle({ roomId, status }: { roomId: string; status: RoomStatus }) {
  if (status === 'OCCUPIED') return null;

  return (
    <form action={setRoomStatusAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="roomId" value={roomId} />
      <input
        type="hidden"
        name="status"
        value={status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'}
      />
      {status === 'MAINTENANCE' ? null : (
        <Input
          name="lockReason"
          placeholder="Keterangan perbaikan"
          className="h-9 w-56 text-[13px]"
        />
      )}
      <Button type="submit" variant="outline" size="sm">
        <Wrench aria-hidden />
        {status === 'MAINTENANCE' ? 'Selesai diperbaiki' : 'Tandai perbaikan'}
      </Button>
    </form>
  );
}
