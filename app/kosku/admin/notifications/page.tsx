import { NotificationList } from '@/components/dashboard/notification-list';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Notifikasi' };

export default async function AdminNotificationsPage() {
  const user = await requireAdmin();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  return (
    <NotificationList
      notifications={notifications}
      unread={notifications.filter((item) => !item.isRead).length}
    />
  );
}
