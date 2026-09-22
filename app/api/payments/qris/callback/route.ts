import { NextResponse } from 'next/server';
import { z } from 'zod';

import { confirmBillPayment, confirmBookingPayment, BookingError } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { getPaymentProvider, PaymentError } from '@/lib/payment/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook pembayaran QRIS.
 *
 * Bentuknya sengaja dibuat sama persis dengan webhook gateway sungguhan:
 * menerima body { qrisRef, status, amount }, memverifikasinya lewat
 * PaymentProvider, lalu memperbarui status di database. Saat nanti pindah
 * ke gateway asli, cukup ganti implementasi provider-nya.
 */

const callbackSchema = z.object({
  qrisRef: z.string().min(1),
  status: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  signature: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Body harus berupa JSON.' }, { status: 400 });
  }

  const parsed = callbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Data callback tidak lengkap: butuh qrisRef, status, dan amount.' },
      { status: 400 },
    );
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.verifyCallback(parsed.data);

    const payment = await prisma.payment.findUnique({
      where: { qrisRef: result.reference },
      select: { id: true, bookingId: true, billId: true, status: true, amount: true },
    });

    if (!payment) {
      return NextResponse.json(
        { ok: false, message: 'Referensi pembayaran tidak dikenal.' },
        { status: 404 },
      );
    }

    if (!result.paid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REJECTED', note: `Pembayaran gagal (status: ${parsed.data.status})` },
      });
      return NextResponse.json({ ok: true, paid: false, message: 'Pembayaran tidak berhasil.' });
    }

    if (payment.amount !== result.amount) {
      return NextResponse.json(
        { ok: false, message: 'Nominal pembayaran tidak sesuai.' },
        { status: 400 },
      );
    }

    if (payment.bookingId) {
      const outcome = await confirmBookingPayment({
        bookingId: payment.bookingId,
        qrisRef: result.reference,
        amount: result.amount,
      });
      return NextResponse.json({
        ok: true,
        paid: true,
        alreadyPaid: outcome.alreadyPaid,
        redirect: '/kosku/tenant',
      });
    }

    if (payment.billId) {
      const outcome = await confirmBillPayment({
        billId: payment.billId,
        qrisRef: result.reference,
        amount: result.amount,
      });
      return NextResponse.json({
        ok: true,
        paid: true,
        alreadyPaid: outcome.alreadyPaid,
        redirect: `/kosku/tenant/bills/${payment.billId}`,
      });
    }

    return NextResponse.json(
      { ok: false, message: 'Pembayaran tidak terhubung ke booking maupun tagihan.' },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    if (error instanceof BookingError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 409 });
    }
    console.error('[qris-callback]', error);
    return NextResponse.json(
      { ok: false, message: 'Terjadi kesalahan saat memproses pembayaran.' },
      { status: 500 },
    );
  }
}
