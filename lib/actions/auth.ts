'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  requireUser,
  verifyPassword,
} from '@/lib/auth';
import { createBooking } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { saveImage, UploadError } from '@/lib/storage';
import {
  changePasswordSchema,
  firstError,
  loginSchema,
  profileSchema,
  registerSchema,
} from '@/lib/validations';

export type ActionState = { error?: string; success?: string };

function safeNext(value: FormDataEntryValue | null): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  // Hanya izinkan path internal untuk mencegah open redirect.
  if (!text.startsWith('/') || text.startsWith('//')) return null;
  return text;
}

/** Membuat booking dari data yang dibawa form login/daftar (opsional). */
async function createPendingBooking(userId: string, formData: FormData): Promise<string | null> {
  const roomId = formData.get('roomId');
  const startDate = formData.get('startDate');
  const durationMonths = formData.get('durationMonths');
  if (typeof roomId !== 'string' || !roomId) return null;
  if (typeof startDate !== 'string' || Number.isNaN(Date.parse(startDate))) return null;

  const duration = Number(durationMonths);
  if (![1, 3, 6, 12].includes(duration)) return null;

  try {
    return await createBooking({
      userId,
      roomId,
      startDate: new Date(`${startDate}T00:00:00`),
      durationMonths: duration,
    });
  } catch {
    return null;
  }
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true, passwordHash: true, role: true, isActive: true },
  });

  // Pesan sengaja dibuat sama agar username yang ada tidak bisa ditebak.
  if (!user) return { error: 'Username atau password salah.' };
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: 'Username atau password salah.' };
  if (!user.isActive) return { error: 'Akun Anda dinonaktifkan. Hubungi pemilik kos.' };

  await createSession(user);

  const bookingId = await createPendingBooking(user.id, formData);
  if (bookingId) redirect(`/kosku/payment/${bookingId}`);

  const next = safeNext(formData.get('next'));
  redirect(next ?? (user.role === 'ADMIN' ? '/kosku/admin' : '/kosku/tenant'));
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    email: formData.get('email') ?? '',
    occupation: formData.get('occupation') ?? '',
    emergencyName: formData.get('emergencyName'),
    emergencyPhone: formData.get('emergencyPhone'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  });
  if (existing) return { error: 'Username sudah dipakai. Coba username lain.' };

  let idCardUrl: string | null = null;
  const idCard = formData.get('idCard');
  if (idCard instanceof File && idCard.size > 0) {
    try {
      idCardUrl = await saveImage(idCard);
    } catch (error) {
      if (error instanceof UploadError) return { error: `Foto KTP: ${error.message}` };
      return { error: 'Gagal mengunggah foto KTP. Coba lagi.' };
    }
  }

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
      role: 'TENANT',
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      occupation: parsed.data.occupation || null,
      emergencyName: parsed.data.emergencyName,
      emergencyPhone: parsed.data.emergencyPhone,
      idCardUrl,
    },
    select: { id: true, role: true },
  });

  await createSession(user);

  const bookingId = await createPendingBooking(user.id, formData);
  if (bookingId) redirect(`/kosku/payment/${bookingId}`);

  const next = safeNext(formData.get('next'));
  redirect(next ?? '/kosku/tenant');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/kosku');
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    email: formData.get('email') ?? '',
    occupation: formData.get('occupation') ?? '',
    emergencyName: formData.get('emergencyName') ?? '',
    emergencyPhone: formData.get('emergencyPhone') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  let idCardUrl: string | undefined;
  const idCard = formData.get('idCard');
  if (idCard instanceof File && idCard.size > 0) {
    try {
      idCardUrl = await saveImage(idCard);
    } catch (error) {
      if (error instanceof UploadError) return { error: `Foto KTP: ${error.message}` };
      return { error: 'Gagal mengunggah foto KTP.' };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      occupation: parsed.data.occupation || null,
      emergencyName: parsed.data.emergencyName || null,
      emergencyPhone: parsed.data.emergencyPhone || null,
      ...(idCardUrl ? { idCardUrl } : {}),
    },
  });

  revalidatePath('/kosku/tenant/profile');
  return { success: 'Profil berhasil diperbarui.' };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const current = await getCurrentUser();
  if (!current) return { error: 'Anda belum masuk.' };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: 'Akun tidak ditemukan.' };

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: 'Password lama salah.' };

  await prisma.user.update({
    where: { id: current.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  // Session lain dicabut supaya perangkat lama harus login ulang.
  await prisma.session.deleteMany({ where: { userId: current.id } });
  await createSession({ id: current.id, role: current.role });

  return { success: 'Password berhasil diganti.' };
}
