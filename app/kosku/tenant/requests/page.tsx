import Link from 'next/link';
import { Inbox, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { Alert, EmptyState, PageHeader } from '@/components/ui/misc';
import { RequestStatusBadge, REQUEST_TYPE_LABEL } from '@/components/ui/status';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { describeRequest } from '@/lib/request-helpers';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Pengajuan saya' };

export default async function TenantRequestsPage({
  searchParams,
}: {
  searchParams: { created?: string };
}) {
  const user = await requireTenant();

  const requests = await prisma.request.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Pengajuan saya"
        description="Perpanjang sewa, pindah kamar, check-out, izin tamu, atau layanan tambahan."
        action={
          <ButtonLink href="/kosku/tenant/requests/new">
            <Plus aria-hidden />
            Pengajuan baru
          </ButtonLink>
        }
      />

      {searchParams.created ? (
        <Alert tone="success" title="Pengajuan terkirim">
          Pemilik kos akan meninjau pengajuan Anda. Statusnya bisa dipantau di halaman ini.
        </Alert>
      ) : null}

      {requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox aria-hidden />}
            title="Belum ada pengajuan"
            description="Semua permintaan ke pemilik kos diajukan lewat halaman ini agar tercatat rapi."
            action={<ButtonLink href="/kosku/tenant/requests/new">Buat pengajuan</ButtonLink>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[14.5px] font-semibold text-ink">
                    {REQUEST_TYPE_LABEL[request.type]}
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {describeRequest(request.type, request.payload)}
                  </p>
                  {request.note ? (
                    <p className="text-[12.5px] leading-relaxed text-ink-muted">
                      Catatan Anda: {request.note}
                    </p>
                  ) : null}
                  {request.adminNote ? (
                    <p className="rounded-md bg-surface-muted px-3 py-2 text-[12.5px] leading-relaxed text-ink">
                      Balasan pemilik kos: {request.adminNote}
                    </p>
                  ) : null}
                  <p className="text-[11.5px] text-ink-subtle">
                    Diajukan {formatDateTime(request.createdAt)}
                  </p>
                </div>
                <div className="shrink-0">
                  <RequestStatusBadge status={request.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
