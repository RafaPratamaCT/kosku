'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { CalendarClock, DoorOpen, LogOut, Sparkles, Users } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { createRequestAction } from '@/lib/actions/requests';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

type RequestType = 'EXTEND' | 'ROOM_CHANGE' | 'CHECKOUT' | 'GUEST' | 'SERVICE';

const TYPES: { value: RequestType; label: string; description: string; icon: typeof Users }[] = [
  {
    value: 'EXTEND',
    label: 'Perpanjang sewa',
    description: 'Tambah masa sewa kamar',
    icon: CalendarClock,
  },
  {
    value: 'ROOM_CHANGE',
    label: 'Pindah kamar',
    description: 'Pindah ke kamar lain yang kosong',
    icon: DoorOpen,
  },
  { value: 'CHECKOUT', label: 'Check-out', description: 'Akhiri masa sewa', icon: LogOut },
  {
    value: 'GUEST',
    label: 'Izin tamu menginap',
    description: 'Tamu menginap sementara',
    icon: Users,
  },
  {
    value: 'SERVICE',
    label: 'Layanan tambahan',
    description: 'Laundry, galon, parkir',
    icon: Sparkles,
  },
];

export function RequestForm({
  availableRooms,
  defaultType,
  minDate,
}: {
  availableRooms: { id: string; number: string; price: number; type: string }[];
  defaultType?: string;
  minDate: string;
}) {
  const [state, formAction] = useFormState(createRequestAction, {} as { error?: string });
  const [type, setType] = React.useState<RequestType>(
    TYPES.some((item) => item.value === defaultType) ? (defaultType as RequestType) : 'EXTEND',
  );

  return (
    <form action={formAction} className="space-y-7">
      <input type="hidden" name="type" value={type} />

      <div className="space-y-3">
        <p className="text-[13px] font-medium text-ink">
          Jenis pengajuan<span className="ml-0.5 text-danger">*</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              aria-pressed={type === item.value}
              className={cn(
                'flex items-start gap-3 rounded-md border p-4 text-left transition-all duration-200',
                type === item.value
                  ? 'border-brand/35 bg-brand-soft shadow-xs'
                  : 'border-line-strong bg-surface hover:border-brand/25 hover:bg-surface-muted',
              )}
            >
              <item.icon
                className={cn(
                  'mt-0.5 size-[18px] shrink-0',
                  type === item.value ? 'text-brand' : 'text-ink-subtle',
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-[13.5px] font-semibold',
                    type === item.value ? 'text-brand-ink' : 'text-ink',
                  )}
                >
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 border-t border-line pt-7">
        {type === 'EXTEND' ? (
          <Field label="Perpanjang berapa bulan" required htmlFor="extendMonths">
            <Select id="extendMonths" name="extendMonths" defaultValue="3">
              {[1, 3, 6, 12].map((month) => (
                <option key={month} value={month}>
                  {month} bulan
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {type === 'ROOM_CHANGE' ? (
          availableRooms.length === 0 ? (
            <Alert tone="warn" title="Belum ada kamar kosong">
              Saat ini semua kamar terisi. Coba ajukan lagi lain waktu.
            </Alert>
          ) : (
            <Field label="Kamar tujuan" required htmlFor="targetRoomId">
              <Select id="targetRoomId" name="targetRoomId" required>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Kamar {room.number} · {room.type} · {formatRupiah(room.price)}/bulan
                  </option>
                ))}
              </Select>
            </Field>
          )
        ) : null}

        {type === 'CHECKOUT' ? (
          <Field
            label="Rencana tanggal check-out"
            required
            htmlFor="checkoutDate"
            hint="Mohon ajukan minimal 30 hari sebelumnya."
          >
            <Input id="checkoutDate" name="checkoutDate" type="date" min={minDate} required />
          </Field>
        ) : null}

        {type === 'GUEST' ? (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Nama tamu" required htmlFor="guestName" className="sm:col-span-2">
              <Input id="guestName" name="guestName" required placeholder="Nama lengkap tamu" />
            </Field>
            <Field label="Jumlah malam" required htmlFor="guestNights">
              <Input
                id="guestNights"
                name="guestNights"
                type="number"
                min={1}
                max={14}
                defaultValue={1}
                required
              />
            </Field>
            <Field label="Nomor identitas tamu" htmlFor="guestIdNumber" className="sm:col-span-3">
              <Input id="guestIdNumber" name="guestIdNumber" placeholder="Nomor KTP / SIM" />
            </Field>
          </div>
        ) : null}

        {type === 'SERVICE' ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Jenis layanan" required htmlFor="serviceType">
              <Select id="serviceType" name="serviceType" defaultValue="Laundry">
                <option value="Laundry">Laundry</option>
                <option value="Galon">Galon</option>
                <option value="Parkir Motor">Parkir motor</option>
                <option value="Parkir Mobil">Parkir mobil</option>
              </Select>
            </Field>
            <Field label="Jumlah" required htmlFor="serviceQty">
              <Input
                id="serviceQty"
                name="serviceQty"
                type="number"
                min={1}
                max={50}
                defaultValue={1}
                required
              />
            </Field>
          </div>
        ) : null}

        <Field label="Catatan untuk pemilik kos" htmlFor="note" hint="Opsional.">
          <Textarea id="note" name="note" rows={4} placeholder="Tulis keterangan tambahan..." />
        </Field>
      </div>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <SubmitButton size="lg" className="w-full sm:w-auto">
        Kirim pengajuan
      </SubmitButton>
    </form>
  );
}
