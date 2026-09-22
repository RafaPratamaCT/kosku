import Link from 'next/link';
import type { ComplaintStatus, Prisma } from '@prisma/client';
import { MessageSquareWarning, Plus } from 'lucide-react';

import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { ComplaintStatusBadge, PriorityBadge } from '@/components/ui/status';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Komplain saya' };

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'OPEN', label: 'Baru' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Ditutup' },
];

export default async function TenantComplaintsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireTenant();

  const where: Prisma.ComplaintWhereInput = { userId: user.id };
  if (searchParams.status && TABS.some((tab) => tab.value === searchParams.status && tab.value)) {
    where.status = searchParams.status as ComplaintStatus;
  }

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { replies: true } } },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Komplain saya"
        description="Laporkan kerusakan atau gangguan, lalu pantau penanganannya di sini."
        action={
          <ButtonLink href="/kosku/tenant/complaints/new">
            <Plus aria-hidden />
            Komplain baru
          </ButtonLink>
        }
      />

      <StatusFilterTabs tabs={TABS} paramName="status" basePath="/kosku/tenant/complaints" />

      {complaints.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageSquareWarning aria-hidden />}
            title="Belum ada komplain"
            description="Kalau ada yang rusak atau mengganggu, laporkan supaya bisa segera ditangani."
            action={<ButtonLink href="/kosku/tenant/complaints/new">Buat komplain</ButtonLink>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <Link key={complaint.id} href={`/kosku/tenant/complaints/${complaint.id}`}>
              <Card interactive className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14.5px] font-semibold text-ink">{complaint.title}</p>
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
                      {complaint.description}
                    </p>
                    <p className="text-[11.5px] text-ink-subtle">
                      {complaint.category} · {formatDateTime(complaint.createdAt)}
                      {complaint._count.replies > 0 ? ` · ${complaint._count.replies} balasan` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ComplaintStatusBadge status={complaint.status} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
