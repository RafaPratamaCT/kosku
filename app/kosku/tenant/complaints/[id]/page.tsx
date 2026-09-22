import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { ComplaintThread } from '@/components/complaint-thread';
import { ReplyForm } from '@/components/tenant/reply-form';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/misc';
import { ComplaintStatusBadge, PriorityBadge } from '@/components/ui/status';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Detail komplain' };

export default async function TenantComplaintDetailPage({ params }: { params: { id: string } }) {
  const user = await requireTenant();

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { fullName: true } },
      room: { select: { number: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { fullName: true, role: true } } },
      },
    },
  });

  if (!complaint) notFound();
  // Penghuni hanya boleh membuka komplain miliknya sendiri.
  if (complaint.userId !== user.id) notFound();

  const closed = complaint.status === 'CLOSED';

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

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold leading-tight text-ink">{complaint.title}</h1>
            <ComplaintStatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <p className="text-[13px] text-ink-muted">
            {complaint.category}
            {complaint.room ? ` · Kamar ${complaint.room.number}` : ''} ·{' '}
            {formatDateTime(complaint.createdAt)}
          </p>
        </div>
      </div>

      {complaint.status === 'RESOLVED' ? (
        <Alert tone="success" title="Komplain sudah ditandai selesai">
          Kalau masalahnya muncul lagi, balas di bawah agar bisa ditinjau ulang.
        </Alert>
      ) : null}

      <Card className="space-y-6 p-6">
        <ComplaintThread
          description={complaint.description}
          createdAt={complaint.createdAt}
          authorName={complaint.user.fullName}
          photoUrls={complaint.photoUrls}
          viewerIsAdmin={false}
          replies={complaint.replies.map((reply) => ({
            id: reply.id,
            message: reply.message,
            createdAt: reply.createdAt,
            authorName: reply.user.fullName,
            isAdmin: reply.user.role === 'ADMIN',
          }))}
        />

        {closed ? (
          <div className="border-t border-line pt-5">
            <p className="text-center text-[13px] text-ink-muted">
              Komplain ini sudah ditutup, jadi balasan baru tidak bisa dikirim.
            </p>
          </div>
        ) : (
          <div className="border-t border-line pt-5">
            <ReplyForm
              complaintId={complaint.id}
              placeholder="Tulis balasan untuk pemilik kos..."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
