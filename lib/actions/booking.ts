'use server';

import { redirect } from 'next/navigation';

import type { ActionState } from '@/lib/actions/auth';
import { getCurrentUser } from '@/lib/auth';
import { BookingError, createBooking } from '@/lib/bookings';
import { bookingSchema, firstError } from '@/lib/validations';

export async function startBookingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = bookingSchema.safeParse({
    roomId: formData.get('roomId'),
    startDate: formData.get('startDate'),
    durationMonths: formData.get('durationMonths'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await getCurrentUser();
  if (!user) {
    const search = new URLSearchParams({
      roomId: parsed.data.roomId,
      startDate: parsed.data.startDate,
      durationMonths: String(parsed.data.durationMonths),
    });
    redirect(`/kosku/register?${search.toString()}`);
  }

  if (user.role === 'ADMIN') {
    return {
      error: 'Akun admin tidak bisa melakukan booking. Gunakan akun penghuni.',
    };
  }

  let bookingId: string;
  try {
    bookingId = await createBooking({
      userId: user.id,
      roomId: parsed.data.roomId,
      startDate: new Date(`${parsed.data.startDate}T00:00:00`),
      durationMonths: parsed.data.durationMonths,
    });
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    return { error: 'Gagal membuat booking. Coba beberapa saat lagi.' };
  }

  redirect(`/kosku/payment/${bookingId}`);
}
