'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import type { ActionState } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveImages, UploadError } from '@/lib/storage';
import { firstError, roomSchema } from '@/lib/validations';

async function assertAdmin(): Promise<void> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('Anda tidak punya akses.');
}

function parseFacilities(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export async function createRoomAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const parsed = roomSchema.safeParse({
    number: formData.get('number'),
    type: formData.get('type'),
    floor: formData.get('floor'),
    price: formData.get('price'),
    size: formData.get('size'),
    description: formData.get('description') ?? '',
    facilities: parseFacilities(formData.get('facilities')),
    status: formData.get('status') ?? 'AVAILABLE',
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const existing = await prisma.room.findUnique({
    where: { number: parsed.data.number },
    select: { id: true },
  });
  if (existing) return { error: `Nomor kamar ${parsed.data.number} sudah dipakai.` };

  let photoUrls: string[] = [];
  const photos = formData.getAll('photos').filter((item): item is File => item instanceof File);
  if (photos.length > 0) {
    try {
      photoUrls = await saveImages(photos, 6);
    } catch (error) {
      if (error instanceof UploadError) return { error: `Foto: ${error.message}` };
      return { error: 'Gagal mengunggah foto kamar.' };
    }
  }

  const room = await prisma.room.create({
    data: {
      number: parsed.data.number,
      type: parsed.data.type,
      floor: parsed.data.floor,
      price: parsed.data.price,
      size: parsed.data.size,
      description: parsed.data.description ?? '',
      facilities: parsed.data.facilities ?? [],
      status: parsed.data.status ?? 'AVAILABLE',
      photos: {
        createMany: {
          data: photoUrls.map((url, index) => ({ url, order: index })),
        },
      },
    },
    select: { id: true },
  });

  revalidatePath('/kosku/admin/rooms');
  revalidatePath('/kosku/rooms');
  redirect(`/kosku/admin/rooms/${room.id}?created=1`);
}

export async function updateRoomAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();

  const roomId = formData.get('roomId');
  if (typeof roomId !== 'string') return { error: 'Kamar tidak dikenali.' };

  const parsed = roomSchema.safeParse({
    number: formData.get('number'),
    type: formData.get('type'),
    floor: formData.get('floor'),
    price: formData.get('price'),
    size: formData.get('size'),
    description: formData.get('description') ?? '',
    facilities: parseFacilities(formData.get('facilities')),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const duplicate = await prisma.room.findFirst({
    where: { number: parsed.data.number, id: { not: roomId } },
    select: { id: true },
  });
  if (duplicate) return { error: `Nomor kamar ${parsed.data.number} sudah dipakai kamar lain.` };

  const photos = formData.getAll('photos').filter((item): item is File => item instanceof File);
  if (photos.length > 0) {
    try {
      const urls = await saveImages(photos, 6);
      const last = await prisma.roomPhoto.findFirst({
        where: { roomId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const start = (last?.order ?? -1) + 1;
      await prisma.roomPhoto.createMany({
        data: urls.map((url, index) => ({ roomId, url, order: start + index })),
      });
    } catch (error) {
      if (error instanceof UploadError) return { error: `Foto: ${error.message}` };
      return { error: 'Gagal mengunggah foto kamar.' };
    }
  }

  await prisma.room.update({
    where: { id: roomId },
    data: {
      number: parsed.data.number,
      type: parsed.data.type,
      floor: parsed.data.floor,
      price: parsed.data.price,
      size: parsed.data.size,
      description: parsed.data.description ?? '',
      facilities: parsed.data.facilities ?? [],
    },
  });

  revalidatePath(`/kosku/admin/rooms/${roomId}`);
  revalidatePath('/kosku/admin/rooms');
  revalidatePath('/kosku/rooms');
  return { success: 'Data kamar tersimpan.' };
}

export async function deleteRoomPhotoAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const photoId = formData.get('photoId');
  if (typeof photoId !== 'string') return;

  const photo = await prisma.roomPhoto.delete({
    where: { id: photoId },
    select: { roomId: true },
  });
  revalidatePath(`/kosku/admin/rooms/${photo.roomId}`);
}

/** Mengunci atau membuka kunci kamar agar tidak bisa dibooking. */
export async function toggleRoomLockAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const roomId = formData.get('roomId');
  const reason = formData.get('lockReason');
  if (typeof roomId !== 'string') return;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { status: true },
  });
  if (!room) return;
  if (room.status === 'OCCUPIED') return;

  if (room.status === 'LOCKED') {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'AVAILABLE', lockReason: null },
    });
  } else {
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'LOCKED',
        lockReason:
          typeof reason === 'string' && reason.trim()
            ? reason.trim().slice(0, 200)
            : 'Dikunci oleh pemilik kos.',
      },
    });
  }

  revalidatePath('/kosku/admin/rooms');
  revalidatePath('/kosku/rooms');
}

export async function setRoomStatusAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const roomId = formData.get('roomId');
  const status = formData.get('status');
  const reason = formData.get('lockReason');
  const allowed = ['AVAILABLE', 'LOCKED', 'MAINTENANCE'] as const;

  if (typeof roomId !== 'string' || typeof status !== 'string') return;
  if (!allowed.includes(status as (typeof allowed)[number])) return;

  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { status: true } });
  if (!room || room.status === 'OCCUPIED') return;

  await prisma.room.update({
    where: { id: roomId },
    data: {
      status: status as (typeof allowed)[number],
      lockReason:
        status === 'AVAILABLE'
          ? null
          : typeof reason === 'string' && reason.trim()
            ? reason.trim().slice(0, 200)
            : null,
    },
  });

  revalidatePath('/kosku/admin/rooms');
  revalidatePath(`/kosku/admin/rooms/${roomId}`);
  revalidatePath('/kosku/rooms');
}
