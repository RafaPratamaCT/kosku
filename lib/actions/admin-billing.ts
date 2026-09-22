'use server';

import { revalidatePath } from 'next/cache';

import type { ActionState } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { applyOverdueAndLateFees, generateBillsForPeriod, recalculateBill } from '@/lib/billing';
import { prisma } from '@/lib/db';
import { formatPeriod, formatRupiah } from '@/lib/format';
import { notify } from '@/lib/notifications';
import { billItemSchema, expenseSchema, firstError } from '@/lib/validations';

async function assertAdmin(): Promise<void> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('Anda tidak punya akses.');
}

/** Tombol "Generate Tagihan Bulan Ini" di dashboard admin. */
export async function generateBillsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const periodInput = formData.get('period');
  const period =
    typeof periodInput === 'string' && /^\d{4}-\d{2}$/.test(periodInput) ? periodInput : undefined;

  const generated = await generateBillsForPeriod(period);
  const overdue = await applyOverdueAndLateFees();

  revalidatePath('/kosku/admin/bills');
  revalidatePath('/kosku/admin');

  return {
    success:
      generated.created === 0
        ? `Tidak ada tagihan baru untuk ${formatPeriod(generated.period)}. ${overdue.updated} tagihan ditandai telat.`
        : `${generated.created} tagihan ${formatPeriod(generated.period)} berhasil dibuat. ${overdue.updated} tagihan ditandai telat.`,
  };
}

/** Menambahkan biaya tambahan ke sebuah tagihan (listrik, air, denda, dll). */
export async function addBillItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const parsed = billItemSchema.safeParse({
    billId: formData.get('billId'),
    label: formData.get('label'),
    amount: formData.get('amount'),
    type: formData.get('type'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const bill = await prisma.bill.findUnique({
    where: { id: parsed.data.billId },
    select: { id: true, status: true, tenancy: { select: { userId: true } }, period: true },
  });
  if (!bill) return { error: 'Tagihan tidak ditemukan.' };
  if (bill.status === 'PAID') return { error: 'Tagihan yang sudah lunas tidak bisa diubah.' };

  await prisma.billItem.create({
    data: {
      billId: bill.id,
      label: parsed.data.label,
      amount: parsed.data.amount,
      type: parsed.data.type,
    },
  });
  await recalculateBill(bill.id);

  await notify({
    userId: bill.tenancy.userId,
    title: 'Ada biaya tambahan',
    message: `${parsed.data.label} sebesar ${formatRupiah(parsed.data.amount)} ditambahkan ke tagihan ${formatPeriod(bill.period)}.`,
    link: `/kosku/tenant/bills/${bill.id}`,
  });

  revalidatePath(`/kosku/admin/bills/${bill.id}`);
  return { success: 'Biaya tambahan tersimpan.' };
}

export async function removeBillItemAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const itemId = formData.get('itemId');
  if (typeof itemId !== 'string') return;

  const item = await prisma.billItem.delete({
    where: { id: itemId },
    select: { billId: true },
  });
  await recalculateBill(item.billId);
  revalidatePath(`/kosku/admin/bills/${item.billId}`);
}

/** Admin mencatat pembayaran tunai yang diterima langsung. */
export async function recordCashPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const billId = formData.get('billId');
  const note = formData.get('note');
  if (typeof billId !== 'string') return { error: 'Tagihan tidak dikenali.' };

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { tenancy: { select: { userId: true } } },
  });
  if (!bill) return { error: 'Tagihan tidak ditemukan.' };
  if (bill.status === 'PAID') return { error: 'Tagihan ini sudah lunas.' };

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        billId: bill.id,
        amount: bill.totalAmount,
        method: 'CASH',
        status: 'VERIFIED',
        paidAt: new Date(),
        verifiedAt: new Date(),
        note:
          typeof note === 'string' && note.trim()
            ? note.trim().slice(0, 300)
            : 'Dibayar tunai ke pemilik kos',
      },
    }),
    prisma.bill.update({
      where: { id: bill.id },
      data: { status: 'PAID', paidAt: new Date() },
    }),
  ]);

  await notify({
    userId: bill.tenancy.userId,
    title: 'Pembayaran tunai tercatat',
    message: `Tagihan ${formatPeriod(bill.period)} sebesar ${formatRupiah(bill.totalAmount)} sudah lunas.`,
    link: `/kosku/tenant/bills/${bill.id}`,
  });

  revalidatePath(`/kosku/admin/bills/${bill.id}`);
  revalidatePath('/kosku/admin/bills');
  return { success: 'Pembayaran tunai tercatat dan tagihan ditandai lunas.' };
}

/** Verifikasi atau tolak bukti transfer yang diunggah penghuni. */
export async function verifyPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const paymentId = formData.get('paymentId');
  const decision = formData.get('decision');
  const note = formData.get('note');

  if (typeof paymentId !== 'string') return { error: 'Pembayaran tidak dikenali.' };
  if (decision !== 'VERIFIED' && decision !== 'REJECTED') {
    return { error: 'Keputusan tidak valid.' };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { bill: { include: { tenancy: { select: { userId: true } } } } },
  });
  if (!payment || !payment.bill) return { error: 'Pembayaran tidak ditemukan.' };
  if (payment.status !== 'PENDING') return { error: 'Pembayaran ini sudah diproses.' };

  const bill = payment.bill;
  const overdue = bill.dueDate < new Date();

  if (decision === 'VERIFIED') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          paidAt: payment.paidAt ?? new Date(),
          note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 300) : payment.note,
        },
      }),
      prisma.bill.update({
        where: { id: bill.id },
        data: { status: 'PAID', paidAt: new Date() },
      }),
    ]);

    await notify({
      userId: bill.tenancy.userId,
      title: 'Pembayaran diverifikasi',
      message: `Tagihan ${formatPeriod(bill.period)} sudah lunas. Kwitansi bisa diunduh.`,
      link: `/kosku/tenant/bills/${bill.id}`,
    });
  } else {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          note:
            typeof note === 'string' && note.trim()
              ? note.trim().slice(0, 300)
              : 'Bukti transfer ditolak.',
        },
      }),
      prisma.bill.update({
        where: { id: bill.id },
        data: { status: overdue ? 'OVERDUE' : 'UNPAID' },
      }),
    ]);

    await notify({
      userId: bill.tenancy.userId,
      title: 'Bukti transfer ditolak',
      message:
        typeof note === 'string' && note.trim()
          ? note.trim().slice(0, 200)
          : `Mohon unggah ulang bukti transfer untuk ${formatPeriod(bill.period)}.`,
      link: `/kosku/tenant/bills/${bill.id}`,
    });
  }

  revalidatePath(`/kosku/admin/bills/${bill.id}`);
  revalidatePath('/kosku/admin/bills');
  return {
    success: decision === 'VERIFIED' ? 'Pembayaran diverifikasi.' : 'Bukti transfer ditolak.',
  };
}

export async function createExpenseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const parsed = expenseSchema.safeParse({
    category: formData.get('category'),
    label: formData.get('label'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  await prisma.expense.create({
    data: {
      category: parsed.data.category,
      label: parsed.data.label,
      amount: parsed.data.amount,
      date: new Date(`${parsed.data.date}T00:00:00`),
      note: parsed.data.note || null,
    },
  });

  revalidatePath('/kosku/admin/finance');
  return { success: 'Pengeluaran tercatat.' };
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const expenseId = formData.get('expenseId');
  if (typeof expenseId !== 'string') return;
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath('/kosku/admin/finance');
}
