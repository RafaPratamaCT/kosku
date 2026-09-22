import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { expireStaleBookings } from '@/lib/bookings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Membatalkan booking yang masa hold-nya sudah lewat.
 * Bisa dipanggil oleh Vercel Cron, layanan cron lain, atau admin yang sedang masuk.
 *
 * Contoh: curl -H "Authorization: Bearer $CRON_SECRET" https://domain-anda/api/cron/expire-bookings
 */
async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization');
  if (secret && header === `Bearer ${secret}`) return true;

  const user = await getCurrentUser();
  return user?.role === 'ADMIN';
}

async function handle(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ ok: false, message: 'Tidak diizinkan.' }, { status: 401 });
  }

  const expired = await expireStaleBookings();
  return NextResponse.json({
    ok: true,
    expired,
    message:
      expired === 0 ? 'Tidak ada booking yang kedaluwarsa.' : `${expired} booking dibatalkan.`,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
