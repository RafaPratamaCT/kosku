import { Megaphone, Pin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, IconBox, PageHeader } from '@/components/ui/misc';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateLong } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Pengumuman' };

export default async function TenantAnnouncementsPage() {
  await requireTenant();

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Pengumuman"
        description="Informasi terbaru dari pemilik kos untuk seluruh penghuni."
      />

      {announcements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone aria-hidden />}
            title="Belum ada pengumuman"
            description="Pengumuman dari pemilik kos akan tampil di halaman ini."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex gap-4">
                <IconBox tone={item.isPinned ? 'peach' : 'neutral'}>
                  {item.isPinned ? <Pin aria-hidden /> : <Megaphone aria-hidden />}
                </IconBox>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15.5px] font-semibold text-ink">{item.title}</h2>
                    {item.isPinned ? <Badge tone="warn">Penting</Badge> : null}
                  </div>
                  <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-muted">
                    {item.content}
                  </p>
                  <p className="text-[11.5px] text-ink-subtle">{formatDateLong(item.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
