import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { InvoiceDocument } from '@/lib/pdf/documents';
import { getSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { billId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Anda belum masuk.' }, { status: 401 });
  }

  const bill = await prisma.bill.findUnique({
    where: { id: params.billId },
    include: {
      items: true,
      tenancy: {
        include: {
          room: { select: { number: true } },
          user: { select: { id: true, fullName: true, phone: true } },
        },
      },
    },
  });

  if (!bill) {
    return NextResponse.json({ message: 'Tagihan tidak ditemukan.' }, { status: 404 });
  }

  // Penghuni hanya boleh mengunduh invoice miliknya sendiri.
  if (user.role !== 'ADMIN' && bill.tenancy.userId !== user.id) {
    return NextResponse.json({ message: 'Anda tidak punya akses.' }, { status: 403 });
  }

  const settings = await getSettings();
  const buffer = await renderToBuffer(
    InvoiceDocument({
      settings,
      data: {
        billId: bill.id,
        period: bill.period,
        dueDate: bill.dueDate,
        status: bill.status,
        paidAt: bill.paidAt,
        items: bill.items.map((item) => ({ label: item.label, amount: item.amount })),
        totalAmount: bill.totalAmount,
        tenantName: bill.tenancy.user.fullName,
        tenantPhone: bill.tenancy.user.phone,
        roomNumber: bill.tenancy.room.number,
        createdAt: bill.createdAt,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${bill.period}-kamar-${bill.tenancy.room.number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
