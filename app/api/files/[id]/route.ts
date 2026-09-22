import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** Menyajikan berkas yang tersimpan di database (mode hosting read-only). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const file = await prisma.fileBlob.findUnique({ where: { id: params.id } });
  if (!file) {
    return NextResponse.json({ message: 'Berkas tidak ditemukan.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
    },
  });
}
