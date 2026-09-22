import { NextResponse } from 'next/server';

import { applyOverdueAndLateFees, generateBillsForPeriod } from '@/lib/billing';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Menerbitkan tagihan bulan berjalan untuk semua sewa aktif, lalu menandai
 * tagihan yang lewat jatuh tempo beserta dendanya.
 *
 * Contoh: curl -H "Authorization: Bearer $CRON_SECRET" https://domain-anda/api/cron/generate-bills
 * Bisa juga ditambahkan ?period=2026-03 untuk periode tertentu.
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

  const url = new URL(request.url);
  const period = url.searchParams.get('period') ?? undefined;
  if (period && !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json(
      { ok: false, message: 'Format periode harus YYYY-MM.' },
      { status: 400 },
    );
  }

  const generated = await generateBillsForPeriod(period);
  const overdue = await applyOverdueAndLateFees();

  return NextResponse.json({
    ok: true,
    period: generated.period,
    created: generated.created,
    skipped: generated.skipped,
    markedOverdue: overdue.updated,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
