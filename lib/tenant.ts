import 'server-only';

import { prisma } from '@/lib/db';

/** Sewa yang sedang berjalan milik seorang penghuni, lengkap dengan kamarnya. */
export async function getActiveTenancy(userId: string) {
  return prisma.tenancy.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { room: { include: { photos: { orderBy: { order: 'asc' } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

/** Sewa terakhir apa pun statusnya — dipakai saat masa sewa sudah berakhir. */
export async function getLatestTenancy(userId: string) {
  return prisma.tenancy.findFirst({
    where: { userId },
    include: { room: true },
    orderBy: { createdAt: 'desc' },
  });
}
