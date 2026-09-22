'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { CalendarDays, Info } from 'lucide-react';

import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/misc';
import { Field, Input } from '@/components/ui/field';
import { startBookingAction } from '@/lib/actions/booking';
import { formatDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

const DURATIONS = [1, 3, 6, 12] as const;

function addMonthsClient(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() < day) result.setDate(0);
  return result;
}

export function BookingForm({
  roomId,
  monthlyPrice,
  depositAmount,
  minDate,
  defaultDate,
  isLoggedIn,
}: {
  roomId: string;
  monthlyPrice: number;
  depositAmount: number;
  minDate: string;
  defaultDate: string;
  isLoggedIn: boolean;
}) {
  const [state, formAction] = useFormState(startBookingAction, {} as { error?: string });
  const [duration, setDuration] = React.useState<number>(3);
  const [startDate, setStartDate] = React.useState(defaultDate);

  const rentTotal = monthlyPrice * duration;
  const total = rentTotal + depositAmount;
  const parsedStart = Number.isNaN(Date.parse(startDate))
    ? null
    : new Date(`${startDate}T00:00:00`);
  const endDate = parsedStart ? addMonthsClient(parsedStart, duration) : null;

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="durationMonths" value={duration} />

      <div className="space-y-7 rounded-2xl bg-surface p-6 shadow-soft sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-[17px] font-semibold text-ink">Atur jadwal sewa</h2>
          <p className="text-[13.5px] text-ink-muted">
            Tentukan kapan mulai masuk dan berapa lama Anda ingin menyewa.
          </p>
        </div>

        <Field label="Tanggal masuk" required htmlFor="startDate">
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden
            />
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              min={minDate}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="pl-10"
            />
          </div>
        </Field>

        <div className="space-y-2.5">
          <p className="text-[13px] font-medium text-ink">
            Durasi sewa<span className="ml-0.5 text-danger">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DURATIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                aria-pressed={duration === option}
                className={cn(
                  'rounded-md border px-3 py-3.5 text-center transition-all duration-200',
                  duration === option
                    ? 'border-brand/35 bg-brand-soft shadow-xs'
                    : 'border-line-strong bg-surface hover:border-brand/25 hover:bg-surface-muted',
                )}
              >
                <span
                  className={cn(
                    'block text-[17px] font-bold',
                    duration === option ? 'text-brand-ink' : 'text-ink',
                  )}
                >
                  {option}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-ink-muted">bulan</span>
              </button>
            ))}
          </div>
        </div>

        {endDate ? (
          <div className="flex items-start gap-2.5 rounded-md bg-surface-muted px-4 py-3 text-[13px] text-ink-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
            <p>
              Masa sewa berjalan dari{' '}
              <strong className="font-semibold text-ink">{formatDate(parsedStart!)}</strong> sampai{' '}
              <strong className="font-semibold text-ink">{formatDate(endDate)}</strong>.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="space-y-5 rounded-2xl bg-surface p-6 shadow-soft">
          <h2 className="text-[17px] font-semibold text-ink">Rincian biaya</h2>

          <div className="space-y-2.5 text-[13.5px]">
            <Row
              label={`Sewa ${formatRupiah(monthlyPrice)} × ${duration} bulan`}
              value={formatRupiah(rentTotal)}
            />
            <Row
              label="Deposit (dikembalikan saat check-out)"
              value={formatRupiah(depositAmount)}
            />
          </div>

          <div className="flex items-end justify-between border-t border-line pt-4">
            <span className="text-[13.5px] font-medium text-ink">Total bayar</span>
            <span className="text-[22px] font-bold text-ink">{formatRupiah(total)}</span>
          </div>

          {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

          <SubmitButton size="lg" className="w-full">
            {isLoggedIn ? 'Lanjut ke pembayaran' : 'Lanjut daftar akun'}
          </SubmitButton>

          {!isLoggedIn ? (
            <p className="text-center text-[12.5px] text-ink-muted">
              Sudah punya akun?{' '}
              <Link
                href={`/kosku/login?next=${encodeURIComponent(`/kosku/book/${roomId}`)}`}
                className="font-semibold text-brand hover:underline"
              >
                Masuk dulu
              </Link>
            </p>
          ) : null}
        </div>

        <p className="px-2 text-center text-[12px] leading-relaxed text-ink-subtle">
          Setelah lanjut, kamar dikunci untuk Anda selama masa hold. Kalau pembayaran tidak selesai,
          kamar otomatis dibuka kembali untuk umum.
        </p>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-ink-muted">{label}</span>
      <span className="shrink-0 font-medium text-ink">{value}</span>
    </div>
  );
}
