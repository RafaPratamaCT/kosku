import Link from 'next/link';
import { Bell, BellOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, IconBox, PageHeader } from '@/components/ui/misc';
import { markAllNotificationsReadAction } from '@/lib/actions/notifications';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationList({
  notifications,
  unread,
}: {
  notifications: NotificationRow[];
  unread: number;
}) {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Notifikasi"
        description={
          unread > 0 ? `${unread} notifikasi belum dibaca.` : 'Semua notifikasi sudah dibaca.'
        }
        action={
          unread > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="outline">
                Tandai semua dibaca
              </Button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BellOff aria-hidden />}
            title="Belum ada notifikasi"
            description="Pemberitahuan tentang tagihan, komplain, dan pengajuan akan tampil di sini."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {notifications.map((item) => {
              const content = (
                <div className="flex gap-3.5 px-6 py-4">
                  <IconBox tone={item.isRead ? 'neutral' : 'brand'} className="size-9">
                    <Bell aria-hidden />
                  </IconBox>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start gap-2">
                      <p
                        className={cn(
                          'text-[13.5px] text-ink',
                          item.isRead ? 'font-medium' : 'font-semibold',
                        )}
                      >
                        {item.title}
                      </p>
                      {!item.isRead ? (
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                          aria-label="Belum dibaca"
                        />
                      ) : null}
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-ink-muted">{item.message}</p>
                    <p className="text-[11.5px] text-ink-subtle">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={item.id} className="transition hover:bg-surface-muted/50">
                  {item.link ? <Link href={item.link}>{content}</Link> : content}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
