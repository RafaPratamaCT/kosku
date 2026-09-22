import 'server-only';

import { prisma } from '@/lib/db';
import { notify } from '@/lib/notifications';
import { getSettings, numberSetting } from '@/lib/settings';
import { formatPeriod, formatRupiah } from '@/lib/format';
import { periodOf, startOfDay } from '@/lib/utils';

/** Menentukan tanggal jatuh tempo sebuah periode. */
export function dueDateFor(period: string, checkInDate: Date, defaultDueDay: number): Date {
  const [yearText, monthText] = period.split('-');
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const day = defaultDueDay > 0 ? defaultDueDay : checkInDate.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay), 23, 59, 59, 999);
}

export function lateFeeFor(baseAmount: number, type: string, value: number): number {
  if (value <= 0) return 0;
  if (type === 'PERCENT') return Math.round((baseAmount * value) / 100);
  return Math.round(value);
}

/**
 * Membuat tagihan bulanan untuk semua sewa yang aktif.
 * Aman dipanggil berkali-kali — tagihan yang sudah ada tidak dibuat ulang.
 */
export async function generateBillsForPeriod(period?: string): Promise<{
  created: number;
  skipped: number;
  period: string;
}> {
  const settings = await getSettings();
  const defaultDueDay = numberSetting(settings.defaultDueDay, 0);
  const targetPeriod = period ?? periodOf(new Date());

  const tenancies = await prisma.tenancy.findMany({
    where: { status: 'ACTIVE' },
    include: { room: { select: { number: true } }, bills: { select: { period: true } } },
  });

  let created = 0;
  let skipped = 0;

  for (const tenancy of tenancies) {
    const alreadyBilled = tenancy.bills.some((bill) => bill.period === targetPeriod);
    if (alreadyBilled) {
      skipped += 1;
      continue;
    }

    const due = dueDateFor(targetPeriod, tenancy.startDate, defaultDueDay);
    // Lewati periode di luar masa sewa.
    if (due < tenancy.startDate || due > tenancy.endDate) {
      skipped += 1;
      continue;
    }

    const bill = await prisma.bill.create({
      data: {
        tenancyId: tenancy.id,
        period: targetPeriod,
        dueDate: due,
        baseAmount: tenancy.monthlyPrice,
        lateFee: 0,
        totalAmount: tenancy.monthlyPrice,
        status: 'UNPAID',
        items: {
          create: {
            label: `Sewa kamar ${tenancy.room.number}`,
            amount: tenancy.monthlyPrice,
            type: 'RENT',
          },
        },
      },
      select: { id: true },
    });

    await notify({
      userId: tenancy.userId,
      title: `Tagihan ${formatPeriod(targetPeriod)} terbit`,
      message: `Sebesar ${formatRupiah(tenancy.monthlyPrice)}, jatuh tempo ${due.getDate()}/${due.getMonth() + 1}.`,
      link: `/kosku/tenant/bills/${bill.id}`,
    });

    created += 1;
  }

  return { created, skipped, period: targetPeriod };
}

/**
 * Menandai tagihan yang lewat jatuh tempo sebagai OVERDUE dan
 * menambahkan denda satu kali sesuai pengaturan.
 */
export async function applyOverdueAndLateFees(): Promise<{ updated: number }> {
  const settings = await getSettings();
  const feeType = settings.lateFeeType === 'PERCENT' ? 'PERCENT' : 'FIXED';
  const feeValue = numberSetting(settings.lateFeeValue, 0);
  const today = startOfDay(new Date());

  const overdue = await prisma.bill.findMany({
    where: { status: { in: ['UNPAID', 'OVERDUE'] }, dueDate: { lt: today } },
    select: {
      id: true,
      baseAmount: true,
      lateFee: true,
      status: true,
      tenancyId: true,
      period: true,
    },
  });

  let updated = 0;
  for (const bill of overdue) {
    const fee = bill.lateFee > 0 ? bill.lateFee : lateFeeFor(bill.baseAmount, feeType, feeValue);
    if (bill.status === 'OVERDUE' && bill.lateFee === fee) continue;

    await prisma.$transaction(async (tx) => {
      if (fee > 0 && bill.lateFee === 0) {
        await tx.billItem.create({
          data: { billId: bill.id, label: 'Denda keterlambatan', amount: fee, type: 'FINE' },
        });
      }
      await tx.bill.update({
        where: { id: bill.id },
        data: { status: 'OVERDUE', lateFee: fee, totalAmount: bill.baseAmount + fee },
      });
    });
    updated += 1;
  }

  return { updated };
}

/** Menghitung ulang total tagihan dari rincian item-nya. */
export async function recalculateBill(billId: string): Promise<void> {
  const items = await prisma.billItem.findMany({ where: { billId } });
  const lateFee = items
    .filter((item) => item.type === 'FINE')
    .reduce((sum, item) => sum + item.amount, 0);
  const baseAmount = items
    .filter((item) => item.type !== 'FINE')
    .reduce((sum, item) => sum + item.amount, 0);

  await prisma.bill.update({
    where: { id: billId },
    data: { baseAmount, lateFee, totalAmount: baseAmount + lateFee },
  });
}
