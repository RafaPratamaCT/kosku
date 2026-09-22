import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ContractDocument } from '@/lib/pdf/documents';
import { getSettings } from '@/lib/settings';
import { ROOM_TYPE_LABEL } from '@/components/ui/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { tenancyId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Anda belum masuk.' }, { status: 401 });
  }

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: params.tenancyId },
    include: {
      room: true,
      user: { select: { id: true, fullName: true, phone: true, idCardUrl: true } },
    },
  });

  if (!tenancy) {
    return NextResponse.json({ message: 'Data sewa tidak ditemukan.' }, { status: 404 });
  }
  if (user.role !== 'ADMIN' && tenancy.userId !== user.id) {
    return NextResponse.json({ message: 'Anda tidak punya akses.' }, { status: 403 });
  }

  const settings = await getSettings();
  const buffer = await renderToBuffer(
    ContractDocument({
      settings,
      data: {
        tenancyId: tenancy.id,
        tenantName: tenancy.user.fullName,
        tenantPhone: tenancy.user.phone,
        tenantIdNumber: null,
        roomNumber: tenancy.room.number,
        roomType: ROOM_TYPE_LABEL[tenancy.room.type],
        roomSize: tenancy.room.size,
        monthlyPrice: tenancy.monthlyPrice,
        depositAmount: tenancy.depositAmount,
        startDate: tenancy.startDate,
        endDate: tenancy.endDate,
        durationMonths: tenancy.durationMonths,
        rules: settings.rules.split('\n').filter(Boolean),
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="kontrak-sewa-kamar-${tenancy.room.number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
