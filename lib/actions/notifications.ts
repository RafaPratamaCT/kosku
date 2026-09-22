'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath('/kosku/tenant/notifications');
  revalidatePath('/kosku/admin/notifications');
}
