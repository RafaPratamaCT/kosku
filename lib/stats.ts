import 'server-only';

import { prisma } from '@/lib/db';
import { formatPeriodShort } from '@/lib/format';
import { endOfMonth, periodOf, startOfMonth } from '@/lib/utils';

export type MonthlyPoint = { period: string; label: string; value: number };

/** Pemasukan terverifikasi per bulan untuk n bulan terakhir. */
export async function revenueByMonth(months = 12): Promise<MonthlyPoint[]> {
  const now = new Date();
  const from = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));

  const payments = await prisma.payment.findMany({
    where: { status: 'VERIFIED', paidAt: { gte: from } },
    select: { amount: true, paidAt: true },
  });

  const buckets = new Map<string, number>();
  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.set(periodOf(date), 0);
  }

  for (const payment of payments) {
    if (!payment.paidAt) continue;
    const key = periodOf(payment.paidAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
  }

  return Array.from(buckets.entries()).map(([period, value]) => ({
    period,
    label: formatPeriodShort(period),
    value,
  }));
}

export async function expensesByMonth(months = 12): Promise<MonthlyPoint[]> {
  const now = new Date();
  const from = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: from } },
    select: { amount: true, date: true },
  });

  const buckets = new Map<string, number>();
  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.set(periodOf(date), 0);
  }

  for (const expense of expenses) {
    const key = periodOf(expense.date);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + expense.amount);
  }

  return Array.from(buckets.entries()).map(([period, value]) => ({
    period,
    label: formatPeriodShort(period),
    value,
  }));
}

/** Total pemasukan pada satu bulan tertentu. */
export async function revenueOfMonth(date: Date): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: {
      status: 'VERIFIED',
      paidAt: { gte: startOfMonth(date), lte: endOfMonth(date) },
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function expenseOfMonth(date: Date): Promise<number> {
  const result = await prisma.expense.aggregate({
    where: { date: { gte: startOfMonth(date), lte: endOfMonth(date) } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}
