import Link from 'next/link';
import type { ComplaintStatus, Prisma } from '@prisma/client';
import { MessageSquareWarning } from 'lucide-react';

import { ComplaintStatusForm } from '@/components/admin/complaint-status-form';
import { ComplaintThread } from '@/components/complaint-thread';
import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { SearchInput } from '@/components/dashboard/search-input';
import { ReplyForm } from '@/components/tenant/reply-form';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { ComplaintStatusBadge, PriorityBadge } from '@/components/ui/status';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Inbox komplain' };

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'OPEN', label: 'Baru' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Ditutup' },
];

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; open?: string };
}) {
  await requireAdmin();

  const where: Prisma.ComplaintWhereInput = {};
  if (searchParams.status && TABS.some((tab) => tab.value === searchParams.status && tab.value)) {
    where.status = searchParams.status as ComplaintStatus;
  }
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: 'insensitive' } },
      { description: { contains: searchParams.q, mode: 'insensitive' } },
      { user: { fullName: { contains: searchParams.q, mode: 'insensitive' } } },
    ];
  }

  const [complaints, counts] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 60,
      include: {
        user: { select: { id: true, fullName: true } },
        room: { select: { number: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.complaint.groupBy({ by: ['status'], _count: true }),
  ]);

  const selectedId = searchParams.open ?? complaints[0]?.id;
  const selected = selectedId
    ? await prisma.complaint.findUnique({
        where: { id: selectedId },
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
          room: { select: { number: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { fullName: true, role: true } } },
          },
        },
      })
    : null;

  const tabs = TABS.map((tab) => ({
    ...tab,
    count: tab.value
      ? (counts.find((item) => item.status === tab.value)?._count ?? 0)
      : counts.reduce((sum, item) => sum + item._count, 0),
  }));

  function linkFor(id: string): string {
    const next = new URLSearchParams();
    if (searchParams.status) next.set('status', searchParams.status);
    if (searchParams.q) next.set('q', searchParams.q);
    next.set('open', id);
    return `/kosku/admin/complaints?${next.toString()}`;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Inbox komplain"
        description="Tanggapi laporan penghuni dan perbarui statusnya supaya mereka tahu progresnya."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterTabs tabs={tabs} paramName="status" basePath="/kosku/admin/complaints" />
        <SearchInput placeholder="Cari komplain..." className="sm:w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <Card className="overflow-hidden">
          {complaints.length === 0 ? (
            <EmptyState
              icon={<MessageSquareWarning aria-hidden />}
              title="Tidak ada komplain"
              description="Belum ada laporan yang cocok dengan filter ini."
            />
          ) : (
            <ul className="max-h-[620px] divide-y divide-line overflow-y-auto">
              {complaints.map((complaint) => (
                <li key={complaint.id}>
                  <Link
                    href={linkFor(complaint.id)}
                    scroll={false}
                    className={cn(
                      'block px-5 py-4 transition',
                      complaint.id === selectedId
                        ? 'bg-brand-soft/60'
                        : 'hover:bg-surface-muted/60',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-[13.5px] font-semibold text-ink">
                          {complaint.title}
                        </p>
                        <p className="truncate text-[12px] text-ink-muted">
                          {complaint.user.fullName}
                          {complaint.room ? ` · Kamar ${complaint.room.number}` : ''}
                        </p>
                        <p className="text-[11.5px] text-ink-subtle">
                          {complaint.category} · {formatDateTime(complaint.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <ComplaintStatusBadge status={complaint.status} />
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {selected ? (
          <Card className="space-y-6 p-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[17px] font-bold text-ink">{selected.title}</h2>
                <ComplaintStatusBadge status={selected.status} />
                <PriorityBadge priority={selected.priority} />
              </div>
              <p className="text-[12.5px] text-ink-muted">
                <Link
                  href={`/kosku/admin/tenants/${selected.user.id}`}
                  className="font-medium text-ink hover:underline"
                >
                  {selected.user.fullName}
                </Link>
                {selected.room ? ` · Kamar ${selected.room.number}` : ''} · {selected.category} ·{' '}
                {formatDateTime(selected.createdAt)}
              </p>
            </div>

            <div className="space-y-2 border-y border-line py-4">
              <p className="text-[12.5px] font-medium text-ink-muted">Ubah status</p>
              <ComplaintStatusForm complaintId={selected.id} current={selected.status} />
            </div>

            <ComplaintThread
              description={selected.description}
              createdAt={selected.createdAt}
              authorName={selected.user.fullName}
              photoUrls={selected.photoUrls}
              viewerIsAdmin
              replies={selected.replies.map((reply) => ({
                id: reply.id,
                message: reply.message,
                createdAt: reply.createdAt,
                authorName: reply.user.fullName,
                isAdmin: reply.user.role === 'ADMIN',
              }))}
            />

            <div className="border-t border-line pt-5">
              <ReplyForm complaintId={selected.id} placeholder="Tulis balasan untuk penghuni..." />
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={<MessageSquareWarning aria-hidden />}
              title="Pilih komplain untuk dibaca"
              description="Klik salah satu laporan di sebelah kiri untuk melihat detail dan membalasnya."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
