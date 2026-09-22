'use server';

import { revalidatePath } from 'next/cache';

import type { ActionState } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRupiah } from '@/lib/format';
import { notify } from '@/lib/notifications';
import { saveSettings, type SettingsMap } from '@/lib/settings';
import { announcementSchema, firstError, settingsSchema } from '@/lib/validations';

async function assertAdmin(): Promise<void> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('Anda tidak punya akses.');
}

export async function saveAnnouncementAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const parsed = announcementSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    isPinned: formData.get('isPinned') === 'on',
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const announcementId = formData.get('announcementId');

  if (typeof announcementId === 'string' && announcementId) {
    await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        isPinned: Boolean(parsed.data.isPinned),
      },
    });
    revalidatePath('/kosku/admin/announcements');
    return { success: 'Pengumuman diperbarui.' };
  }

  await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      isPinned: Boolean(parsed.data.isPinned),
    },
  });

  const tenants = await prisma.user.findMany({
    where: { role: 'TENANT', isActive: true },
    select: { id: true },
  });
  if (tenants.length > 0) {
    await prisma.notification.createMany({
      data: tenants.map((tenant) => ({
        userId: tenant.id,
        title: 'Pengumuman baru',
        message: parsed.data.title,
        link: '/kosku/tenant/announcements',
      })),
    });
  }

  revalidatePath('/kosku/admin/announcements');
  revalidatePath('/kosku/tenant/announcements');
  return { success: 'Pengumuman terbit dan penghuni sudah diberi tahu.' };
}

export async function deleteAnnouncementAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const announcementId = formData.get('announcementId');
  if (typeof announcementId !== 'string') return;
  await prisma.announcement.delete({ where: { id: announcementId } });
  revalidatePath('/kosku/admin/announcements');
}

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const parsed = settingsSchema.safeParse({
    kosName: formData.get('kosName'),
    kosTagline: formData.get('kosTagline') ?? '',
    kosAddress: formData.get('kosAddress') ?? '',
    kosCity: formData.get('kosCity') ?? '',
    kosMapUrl: formData.get('kosMapUrl') ?? '',
    ownerName: formData.get('ownerName') ?? '',
    ownerPhone: formData.get('ownerPhone') ?? '',
    ownerEmail: formData.get('ownerEmail') ?? '',
    bankName: formData.get('bankName') ?? '',
    bankAccountNumber: formData.get('bankAccountNumber') ?? '',
    bankAccountName: formData.get('bankAccountName') ?? '',
    defaultDueDay: formData.get('defaultDueDay'),
    lateFeeType: formData.get('lateFeeType'),
    lateFeeValue: formData.get('lateFeeValue'),
    depositAmount: formData.get('depositAmount'),
    bookingHoldMinutes: formData.get('bookingHoldMinutes'),
    rules: formData.get('rules') ?? '',
    checkInTime: formData.get('checkInTime') ?? '',
    checkOutTime: formData.get('checkOutTime') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const values: Partial<Record<keyof SettingsMap, string>> = {
    kosName: parsed.data.kosName,
    kosTagline: parsed.data.kosTagline ?? '',
    kosAddress: parsed.data.kosAddress ?? '',
    kosCity: parsed.data.kosCity ?? '',
    kosMapUrl: parsed.data.kosMapUrl ?? '',
    ownerName: parsed.data.ownerName ?? '',
    ownerPhone: parsed.data.ownerPhone ?? '',
    ownerEmail: parsed.data.ownerEmail ?? '',
    bankName: parsed.data.bankName ?? '',
    bankAccountNumber: parsed.data.bankAccountNumber ?? '',
    bankAccountName: parsed.data.bankAccountName ?? '',
    defaultDueDay: String(parsed.data.defaultDueDay),
    lateFeeType: parsed.data.lateFeeType,
    lateFeeValue: String(parsed.data.lateFeeValue),
    depositAmount: String(parsed.data.depositAmount),
    bookingHoldMinutes: String(parsed.data.bookingHoldMinutes),
    rules: parsed.data.rules ?? '',
    checkInTime: parsed.data.checkInTime ?? '',
    checkOutTime: parsed.data.checkOutTime ?? '',
  };

  await saveSettings(values);

  revalidatePath('/kosku/admin/settings');
  revalidatePath('/kosku');
  return { success: 'Pengaturan tersimpan.' };
}

/** Memproses check-out penghuni: sewa diakhiri dan kamar dikosongkan. */
export async function checkoutTenantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const tenancyId = formData.get('tenancyId');
  const returnDeposit = formData.get('returnDeposit') === 'on';
  if (typeof tenancyId !== 'string') return { error: 'Data sewa tidak dikenali.' };

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: { room: { select: { id: true, number: true } } },
  });
  if (!tenancy) return { error: 'Data sewa tidak ditemukan.' };
  if (tenancy.status !== 'ACTIVE') return { error: 'Sewa ini sudah tidak aktif.' };

  const unpaid = await prisma.bill.count({
    where: { tenancyId: tenancy.id, status: { in: ['UNPAID', 'OVERDUE'] } },
  });
  if (unpaid > 0) {
    return {
      error: `Masih ada ${unpaid} tagihan yang belum lunas. Selesaikan dulu sebelum check-out.`,
    };
  }

  await prisma.$transaction([
    prisma.tenancy.update({
      where: { id: tenancy.id },
      data: {
        status: 'ENDED',
        endDate: new Date(),
        depositReturned: returnDeposit,
      },
    }),
    prisma.room.update({
      where: { id: tenancy.room.id },
      data: { status: 'AVAILABLE', lockReason: null },
    }),
  ]);

  await notify({
    userId: tenancy.userId,
    title: 'Check-out selesai',
    message: returnDeposit
      ? `Terima kasih sudah tinggal di kamar ${tenancy.room.number}. Deposit ${formatRupiah(tenancy.depositAmount)} dikembalikan.`
      : `Sewa kamar ${tenancy.room.number} sudah berakhir.`,
    link: '/kosku/tenant',
  });

  revalidatePath('/kosku/admin/tenants');
  revalidatePath(`/kosku/admin/tenants/${tenancy.userId}`);
  revalidatePath('/kosku/admin/rooms');
  return {
    success: returnDeposit
      ? 'Check-out selesai dan deposit ditandai sudah dikembalikan.'
      : 'Check-out selesai.',
  };
}

export async function returnDepositAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const tenancyId = formData.get('tenancyId');
  if (typeof tenancyId !== 'string') return;

  const tenancy = await prisma.tenancy.update({
    where: { id: tenancyId },
    data: { depositReturned: true },
    select: { userId: true, depositAmount: true },
  });

  await notify({
    userId: tenancy.userId,
    title: 'Deposit dikembalikan',
    message: `Deposit sebesar ${formatRupiah(tenancy.depositAmount)} sudah dikembalikan.`,
    link: '/kosku/tenant',
  });

  revalidatePath(`/kosku/admin/tenants/${tenancy.userId}`);
  revalidatePath('/kosku/admin/tenants');
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const userId = formData.get('userId');
  if (typeof userId !== 'string') return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, role: true },
  });
  if (!user || user.role === 'ADMIN') return;

  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  if (user.isActive) {
    await prisma.session.deleteMany({ where: { userId } });
  }

  revalidatePath('/kosku/admin/tenants');
  revalidatePath(`/kosku/admin/tenants/${userId}`);
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const bookingId = formData.get('bookingId');
  if (typeof bookingId !== 'string') return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, roomId: true, userId: true },
  });
  if (!booking || booking.status !== 'PENDING') return;

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } }),
    prisma.room.updateMany({
      where: { id: booking.roomId, status: { notIn: ['OCCUPIED', 'MAINTENANCE'] } },
      data: { status: 'AVAILABLE' },
    }),
  ]);

  await notify({
    userId: booking.userId,
    title: 'Booking dibatalkan',
    message: 'Booking Anda dibatalkan oleh pemilik kos. Silakan hubungi pemilik untuk informasi.',
    link: '/kosku/rooms',
  });

  revalidatePath('/kosku/admin/bookings');
  revalidatePath('/kosku/rooms');
}
