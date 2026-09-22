import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import bcrypt from 'bcryptjs';
import type { Role, User } from '@prisma/client';

import { prisma } from '@/lib/db';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signToken, verifyToken } from '@/lib/token';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function randomId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Membuat baris Session di database lalu memasang cookie httpOnly. */
export async function createSession(user: Pick<User, 'id' | 'role'>): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await prisma.session.create({
    data: { id: randomId(), userId: user.id, expiresAt },
  });

  const token = await signToken({
    sid: session.id,
    uid: user.id,
    role: user.role,
    exp: expiresAt.getTime(),
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = await verifyToken(token);
  if (payload) {
    await prisma.session.deleteMany({ where: { id: payload.sid } });
  }
  cookies().delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  phone: string;
  email: string | null;
  isActive: boolean;
};

/**
 * Membaca user yang sedang login. Token cookie diverifikasi dulu,
 * lalu baris Session dicek ke database supaya session yang sudah
 * dihapus tidak bisa dipakai lagi.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          phone: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;
  return session.user;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/kosku/login');
  return user;
}

export async function requireTenant(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'TENANT') redirect('/kosku/admin');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/kosku/tenant');
  return user;
}

/** Versi untuk API route: melempar error, bukan redirect. */
export async function requireApiUser(role?: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('Anda belum masuk.', 401);
  if (role && user.role !== role) throw new AuthError('Anda tidak punya akses.', 403);
  return user;
}

export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/** Menyegarkan cookie ketika role user berubah (contoh: setelah booking dibayar). */
export async function refreshSessionRole(userId: string, role: Role): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = await verifyToken(token);
  if (!payload || payload.uid !== userId) return;

  const next = await signToken({ ...payload, role });
  cookies().set(SESSION_COOKIE, next, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
