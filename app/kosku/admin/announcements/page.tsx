import { Megaphone, Pin, Trash2 } from 'lucide-react';

import { AnnouncementForm } from '@/components/admin/announcement-form';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { deleteAnnouncementAction } from '@/lib/actions/admin-misc';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Pengumuman' };

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Pengumuman"
        description="Setiap pengumuman baru otomatis mengirim notifikasi ke seluruh penghuni aktif."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Card className="space-y-5 p-6">
          <h2 className="text-[15px] font-semibold text-ink">Buat pengumuman</h2>
          <AnnouncementForm />
        </Card>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Megaphone aria-hidden />}
                title="Belum ada pengumuman"
                description="Pengumuman yang Anda terbitkan akan tampil di sini."
              />
            </Card>
          ) : (
            announcements.map((item) => (
              <Card key={item.id} className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-ink">{item.title}</h3>
                      {item.isPinned ? (
                        <Badge tone="warn">
                          <Pin className="size-3" aria-hidden />
                          Disematkan
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-[11.5px] text-ink-subtle">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>

                  <form action={deleteAnnouncementAction}>
                    <input type="hidden" name="announcementId" value={item.id} />
                    <button
                      type="submit"
                      aria-label={`Hapus pengumuman ${item.title}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xs text-ink-subtle transition hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </form>
                </div>

                <details className="group">
                  <summary className="cursor-pointer list-none text-[13px] font-semibold text-brand hover:underline">
                    Lihat & edit isi
                  </summary>
                  <div className="mt-4 border-t border-line pt-4">
                    <AnnouncementForm
                      values={{
                        id: item.id,
                        title: item.title,
                        content: item.content,
                        isPinned: item.isPinned,
                      }}
                    />
                  </div>
                </details>

                <p className="line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">
                  {item.content}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
