'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

import type { ActionState } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notify, notifyAdmins } from '@/lib/notifications';
import { getActiveTenancy } from '@/lib/tenant';
import { addMonths } from '@/lib/utils';
import { firstError, requestSchema } from '@/lib/validations';

const TYPE_LABEL: Record<string, string> = {
  EXTEND: 'Perpanjang sewa',
  ROOM_CHANGE: 'Pindah kamar',
  CHECKOUT: 'Check-out',
  GUEST: 'Izin tamu menginap',
  SERVICE: 'Layanan tambahan',
};

export async function createRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== 'TENANT') return { error: 'Hanya penghuni yang bisa membuat pengajuan.' };

  const parsed = requestSchema.safeParse({
    type: formData.get('type'),
    note: formData.get('note') ?? '',
    extendMonths: formData.get('extendMonths') || undefined,
    targetRoomId: formData.get('targetRoomId') || undefined,
    checkoutDate: formData.get('checkoutDate') || undefined,
    guestName: formData.get('guestName') || undefined,
    guestIdNumber: formData.get('guestIdNumber') || undefined,
    guestNights: formData.get('guestNights') || undefined,
    serviceType: formData.get('serviceType') || undefined,
    serviceQty: formData.get('serviceQty') || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const tenancy = await getActiveTenancy(user.id);
  if (!tenancy) return { error: 'Anda belum punya sewa aktif.' };

  const data = parsed.data;
  let payload: Prisma.InputJsonValue = {};

  switch (data.type) {
    case 'EXTEND': {
      if (!data.extendMonths) return { error: 'Pilih berapa bulan perpanjangan sewanya.' };
      payload = { extendMonths: data.extendMonths };
      break;
    }
    case 'ROOM_CHANGE': {
      if (!data.targetRoomId) return { error: 'Pilih kamar tujuan.' };
      const target = await prisma.room.findUnique({
        where: { id: data.targetRoomId },
        select: { id: true, number: true, status: true },
      });
      if (!target || target.status !== 'AVAILABLE') {
        return { error: 'Kamar tujuan sudah tidak tersedia.' };
      }
      payload = { targetRoomId: target.id, targetRoomNumber: target.number };
      break;
    }
    case 'CHECKOUT': {
      if (!data.checkoutDate || Number.isNaN(Date.parse(data.checkoutDate))) {
        return { error: 'Tanggal check-out tidak valid.' };
      }
      payload = { checkoutDate: data.checkoutDate };
      break;
    }
    case 'GUEST': {
      if (!data.guestName) return { error: 'Nama tamu wajib diisi.' };
      payload = {
        guestName: data.guestName,
        guestIdNumber: data.guestIdNumber ?? '',
        guestNights: data.guestNights ?? 1,
      };
      break;
    }
    case 'SERVICE': {
      if (!data.serviceType) return { error: 'Pilih jenis layanan.' };
      payload = { serviceType: data.serviceType, serviceQty: data.serviceQty ?? 1 };
      break;
    }
  }

  await prisma.request.create({
    data: {
      userId: user.id,
      type: data.type,
      payload,
      note: data.note || null,
      status: 'PENDING',
    },
  });

  await notifyAdmins({
    title: 'Pengajuan baru',
    message: `${user.fullName} mengajukan ${TYPE_LABEL[data.type]}.`,
    link: '/kosku/admin/requests',
  });

  revalidatePath('/kosku/tenant/requests');
  redirect('/kosku/tenant/requests?created=1');
}

/**
 * Admin menyetujui atau menolak pengajuan. Untuk perpanjangan dan pindah
 * kamar, perubahan datanya langsung dijalankan saat disetujui.
 */
export async function decideRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') return { error: 'Anda tidak punya akses.' };

  const requestId = formData.get('requestId');
  const decision = formData.get('decision');
  const adminNote = formData.get('adminNote');

  if (typeof requestId !== 'string') return { error: 'Pengajuan tidak dikenali.' };
  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    return { error: 'Keputusan tidak valid.' };
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: { select: { id: true, fullName: true } } },
  });
  if (!request) return { error: 'Pengajuan tidak ditemukan.' };
  if (request.status !== 'PENDING') return { error: 'Pengajuan ini sudah diputuskan.' };

  const payload = (request.payload ?? {}) as Record<string, unknown>;

  if (decision === 'APPROVED') {
    const tenancy = await prisma.tenancy.findFirst({
      where: { userId: request.userId, status: 'ACTIVE' },
      include: { room: true },
    });

    if (request.type === 'EXTEND' && tenancy) {
      const months = Number(payload.extendMonths ?? 0);
      if (months > 0) {
        await prisma.tenancy.update({
          where: { id: tenancy.id },
          data: {
            endDate: addMonths(tenancy.endDate, months),
            durationMonths: tenancy.durationMonths + months,
          },
        });
      }
    }

    if (request.type === 'ROOM_CHANGE' && tenancy) {
      const targetRoomId = String(payload.targetRoomId ?? '');
      const target = await prisma.room.findUnique({ where: { id: targetRoomId } });
      if (!target || target.status !== 'AVAILABLE') {
        return { error: 'Kamar tujuan sudah tidak tersedia. Tolak pengajuan ini.' };
      }
      await prisma.$transaction([
        prisma.room.update({ where: { id: tenancy.roomId }, data: { status: 'AVAILABLE' } }),
        prisma.room.update({ where: { id: target.id }, data: { status: 'OCCUPIED' } }),
        prisma.tenancy.update({
          where: { id: tenancy.id },
          data: { roomId: target.id, monthlyPrice: target.price },
        }),
      ]);
    }

    if (request.type === 'CHECKOUT' && tenancy) {
      const date = payload.checkoutDate ? new Date(String(payload.checkoutDate)) : new Date();
      await prisma.tenancy.update({
        where: { id: tenancy.id },
        data: { endDate: date },
      });
    }
  }

  await prisma.request.update({
    where: { id: request.id },
    data: {
      status: decision,
      adminNote: typeof adminNote === 'string' && adminNote.trim() ? adminNote.trim() : null,
    },
  });

  await notify({
    userId: request.userId,
    title: decision === 'APPROVED' ? 'Pengajuan disetujui' : 'Pengajuan ditolak',
    message: `${TYPE_LABEL[request.type]} ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'} oleh pemilik kos.`,
    link: '/kosku/tenant/requests',
  });

  revalidatePath('/kosku/admin/requests');
  revalidatePath('/kosku/tenant/requests');
  return {
    success:
      decision === 'APPROVED'
        ? `Pengajuan ${TYPE_LABEL[request.type].toLowerCase()} disetujui.`
        : 'Pengajuan ditolak.',
  };
}
