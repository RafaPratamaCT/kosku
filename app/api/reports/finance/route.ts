import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { periodOf, startOfMonth } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const METHOD_LABEL: Record<string, string> = {
  QRIS_DEMO: 'QRIS (demo)',
  TRANSFER: 'Transfer bank',
  CASH: 'Tunai',
};

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

/** Ekspor CSV laporan keuangan — dibuka lewat tombol di halaman laporan. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Anda tidak punya akses.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const months = Math.min(Math.max(Number(url.searchParams.get('months') ?? 12), 1), 36);
  const now = new Date();
  const from = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { status: 'VERIFIED', paidAt: { gte: from } },
      orderBy: { paidAt: 'asc' },
      include: {
        bill: {
          select: {
            period: true,
            tenancy: {
              select: {
                room: { select: { number: true } },
                user: { select: { fullName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.expense.findMany({ where: { date: { gte: from } }, orderBy: { date: 'asc' } }),
  ]);

  const rows: string[] = [
    [
      'Tanggal',
      'Jenis',
      'Kategori',
      'Keterangan',
      'Kamar',
      'Penghuni',
      'Periode',
      'Pemasukan',
      'Pengeluaran',
    ]
      .map(csvCell)
      .join(','),
  ];

  for (const payment of payments) {
    rows.push(
      [
        isoDate(payment.paidAt ?? payment.createdAt),
        'Pemasukan',
        METHOD_LABEL[payment.method] ?? payment.method,
        payment.note ?? 'Pembayaran tagihan',
        payment.bill?.tenancy.room.number ?? '',
        payment.bill?.tenancy.user.fullName ?? '',
        payment.bill?.period ?? '',
        payment.amount,
        '',
      ]
        .map(csvCell)
        .join(','),
    );
  }

  for (const expense of expenses) {
    rows.push(
      [
        isoDate(expense.date),
        'Pengeluaran',
        expense.category,
        expense.label,
        '',
        '',
        periodOf(expense.date),
        '',
        expense.amount,
      ]
        .map(csvCell)
        .join(','),
    );
  }

  const totalIncome = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  rows.push('');
  rows.push(['', '', '', 'TOTAL', '', '', '', totalIncome, totalExpense].map(csvCell).join(','));
  rows.push(
    ['', '', '', 'LABA BERSIH', '', '', '', totalIncome - totalExpense, ''].map(csvCell).join(','),
  );

  // BOM agar Excel membaca karakter Indonesia dengan benar.
  const csv = `﻿${rows.join('\r\n')}`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan-keuangan-${isoDate(now)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
