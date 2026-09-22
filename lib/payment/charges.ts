import 'server-only';

import { prisma } from '@/lib/db';
import { getPaymentProvider, type Charge } from '@/lib/payment/provider';

/**
 * Menyiapkan QR pembayaran untuk sebuah booking. Kalau sudah pernah dibuat,
 * QR yang sama ditampilkan ulang supaya referensinya tidak berganti-ganti
 * setiap halaman dimuat.
 */
export async function ensureBookingCharge(booking: {
  id: string;
  totalAmount: number;
  holdUntil: Date;
}): Promise<Charge> {
  const provider = getPaymentProvider();

  const existing = await prisma.payment.findFirst({
    where: { bookingId: booking.id, status: 'PENDING', method: 'QRIS_DEMO' },
    orderBy: { createdAt: 'desc' },
  });

  if (existing?.qrisRef) {
    return provider.createCharge({
      amount: booking.totalAmount,
      description: `Booking ${booking.id}`,
      target: { kind: 'BOOKING', bookingId: booking.id },
      reference: existing.qrisRef,
      expiresAt: booking.holdUntil,
    });
  }

  const charge = await provider.createCharge({
    amount: booking.totalAmount,
    description: `Booking ${booking.id}`,
    target: { kind: 'BOOKING', bookingId: booking.id },
    expiresAt: booking.holdUntil,
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: charge.amount,
      method: 'QRIS_DEMO',
      status: 'PENDING',
      qrisRef: charge.reference,
      note: 'Menunggu pembayaran QRIS demo',
    },
  });

  return charge;
}

/** Menyiapkan QR pembayaran untuk satu tagihan bulanan. */
export async function ensureBillCharge(bill: { id: string; totalAmount: number }): Promise<Charge> {
  const provider = getPaymentProvider();

  const existing = await prisma.payment.findFirst({
    where: {
      billId: bill.id,
      status: 'PENDING',
      method: 'QRIS_DEMO',
      amount: bill.totalAmount,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing?.qrisRef) {
    return provider.createCharge({
      amount: bill.totalAmount,
      description: `Tagihan ${bill.id}`,
      target: { kind: 'BILL', billId: bill.id },
      reference: existing.qrisRef,
      expiresInMinutes: 60,
    });
  }

  const charge = await provider.createCharge({
    amount: bill.totalAmount,
    description: `Tagihan ${bill.id}`,
    target: { kind: 'BILL', billId: bill.id },
    expiresInMinutes: 60,
  });

  await prisma.payment.create({
    data: {
      billId: bill.id,
      amount: charge.amount,
      method: 'QRIS_DEMO',
      status: 'PENDING',
      qrisRef: charge.reference,
      note: 'Menunggu pembayaran QRIS demo',
    },
  });

  return charge;
}
