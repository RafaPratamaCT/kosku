import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { RequestForm } from '@/components/tenant/request-form';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/misc';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveTenancy } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Pengajuan baru' };

function toInputDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const user = await requireTenant();
  const tenancy = await getActiveTenancy(user.id);

  const availableRooms = await prisma.room.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { number: 'asc' },
    select: { id: true, number: true, price: true, type: true },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/kosku/tenant/requests"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar pengajuan
        </Link>
        <div className="space-y-1.5">
          <h1 className="text-[24px] font-bold leading-tight text-ink">Buat pengajuan</h1>
          <p className="max-w-2xl text-[14px] leading-relaxed text-ink-muted">
            Pilih jenis pengajuan, lengkapi datanya, lalu kirim. Pemilik kos akan menyetujui atau
            menolak, dan Anda mendapat notifikasi begitu ada keputusan.
          </p>
        </div>
      </div>

      {!tenancy ? (
        <Alert tone="warn" title="Belum ada sewa aktif">
          Pengajuan hanya bisa dibuat kalau Anda sedang menyewa kamar.
        </Alert>
      ) : (
        <Card className="max-w-4xl p-6 sm:p-8">
          <RequestForm
            availableRooms={availableRooms}
            defaultType={searchParams.type}
            minDate={toInputDate(new Date())}
          />
        </Card>
      )}
    </div>
  );
}
