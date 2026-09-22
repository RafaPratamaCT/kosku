import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ReceiptDocument } from '@/lib/pdf/documents';
import { getSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const METHOD_LABEL: Record<string, string> = {
  QRIS_DEMO: 'QRIS (mode demo)',
  TRANSFER: 'Transfer bank',
  CASH: 'Tunai',
};

export async function GET(_request: Request, { params }: { params: { paymentId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Anda belum masuk.' }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: {
      bill: {
        include: {
          tenancy: {
            include: {
              room: { select: { number: true } },
              user: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });

  if (!payment || !payment.bill) {
    return NextResponse.json({ message: 'Pembayaran tidak ditemukan.' }, { status: 404 });
  }
  if (payment.status !== 'VERIFIED') {
    return NextResponse.json(
      { message: 'Kwitansi hanya tersedia untuk pembayaran yang sudah terverifikasi.' },
      { status: 409 },
    );
  }
  if (user.role !== 'ADMIN' && payment.bill.tenancy.userId !== user.id) {
    return NextResponse.json({ message: 'Anda tidak punya akses.' }, { status: 403 });
  }

  const settings = await getSettings();
  const buffer = await renderToBuffer(
    ReceiptDocument({
      settings,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: METHOD_LABEL[payment.method] ?? payment.method,
        paidAt: payment.paidAt ?? payment.createdAt,
        note: payment.note,
        period: payment.bill.period,
        tenantName: payment.bill.tenancy.user.fullName,
        roomNumber: payment.bill.tenancy.room.number,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="kwitansi-${payment.id.slice(-8)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
