import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ComplaintForm } from '@/components/tenant/complaint-form';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/misc';
import { requireTenant } from '@/lib/auth';
import { getActiveTenancy } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Komplain baru' };

export default async function NewComplaintPage() {
  const user = await requireTenant();
  const tenancy = await getActiveTenancy(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/kosku/tenant/complaints"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar komplain
        </Link>
        <div className="space-y-1.5">
          <h1 className="text-[24px] font-bold leading-tight text-ink">Buat komplain baru</h1>
          <p className="max-w-2xl text-[14px] leading-relaxed text-ink-muted">
            Ceritakan masalahnya sejelas mungkin supaya pemilik kos bisa langsung menindaklanjuti.
            {tenancy ? ` Komplain ini otomatis terhubung dengan kamar ${tenancy.room.number}.` : ''}
          </p>
        </div>
      </div>

      {!tenancy ? (
        <Alert tone="warn" title="Belum ada kamar aktif">
          Komplain tetap bisa dikirim, tetapi tidak akan terhubung dengan nomor kamar.
        </Alert>
      ) : null}

      <Card className="max-w-3xl p-6 sm:p-8">
        <ComplaintForm />
      </Card>
    </div>
  );
}
