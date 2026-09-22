import Link from 'next/link';
import type { Prisma, RequestStatus } from '@prisma/client';
import { Inbox } from 'lucide-react';

import { RequestDecision } from '@/components/admin/request-decision';
import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { RequestStatusBadge, REQUEST_TYPE_LABEL } from '@/components/ui/status';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { describeRequest } from '@/lib/request-helpers';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Inbox pengajuan' };

const TABS = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: '', label: 'Semua' },
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdmin();

  const status = searchParams.status ?? 'PENDING';
  const where: Prisma.RequestWhereInput = {};
  if (status && TABS.some((tab) => tab.value === status && tab.value)) {
    where.status = status as RequestStatus;
  }

  const [requests, counts] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            tenancies: {
              where: { status: 'ACTIVE' },
              select: { room: { select: { number: true } } },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.request.groupBy({ by: ['status'], _count: true }),
  ]);

  const tabs = TABS.map((tab) => ({
    ...tab,
    count: tab.value
      ? (counts.find((item) => item.status === tab.value)?._count ?? 0)
      : counts.reduce((sum, item) => sum + item._count, 0),
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        title="Inbox pengajuan"
        description="Perpanjangan sewa dan pindah kamar langsung diterapkan ke data begitu disetujui."
      />

      <StatusFilterTabs tabs={tabs} paramName="status" basePath="/kosku/admin/requests" />

      {requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox aria-hidden />}
            title="Tidak ada pengajuan"
            description="Pengajuan baru dari penghuni akan muncul di sini."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[15px] font-semibold text-ink">
                      {REQUEST_TYPE_LABEL[request.type]}
                    </h2>
                    <RequestStatusBadge status={request.status} />
                  </div>

                  <p className="text-[13.5px] text-ink">
                    {describeRequest(request.type, request.payload)}
                  </p>

                  <p className="text-[12.5px] text-ink-muted">
                    <Link
                      href={`/kosku/admin/tenants/${request.user.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {request.user.fullName}
                    </Link>
                    {request.user.tenancies[0]
                      ? ` · Kamar ${request.user.tenancies[0].room.number}`
                      : ''}{' '}
                    · {formatDateTime(request.createdAt)}
                  </p>

                  {request.note ? (
                    <p className="rounded-md bg-surface-muted px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink">
                      {request.note}
                    </p>
                  ) : null}

                  {request.adminNote ? (
                    <p className="text-[12.5px] text-ink-muted">
                      Catatan Anda: {request.adminNote}
                    </p>
                  ) : null}
                </div>

                {request.status === 'PENDING' ? (
                  <div className="w-full shrink-0 lg:w-80">
                    <RequestDecision requestId={request.id} />
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
