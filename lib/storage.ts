import 'server-only';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '@/lib/db';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export class UploadError extends Error {}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Di komputer sendiri berkas ditulis ke /public/uploads.
 * Di hosting yang filesystem-nya read-only (contoh: Vercel) berkas
 * otomatis disimpan ke database dan disajikan lewat /api/files/[id].
 * Pilihan bisa dipaksa lewat env FILE_STORAGE = "local" | "database".
 */
function storageMode(): 'local' | 'database' {
  const forced = process.env.FILE_STORAGE;
  if (forced === 'local' || forced === 'database') return forced;
  return process.env.VERCEL ? 'database' : 'local';
}

function safeExtension(filename: string, mimeType: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (/^\.(jpe?g|png|webp|gif)$/.test(fromName)) return fromName;
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mimeType] ?? '.bin';
}

function assertImage(file: File): void {
  if (file.size === 0) {
    throw new UploadError('Berkas kosong atau gagal dibaca.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('Ukuran berkas maksimal 5 MB.');
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new UploadError('Format harus berupa gambar JPG, PNG, WEBP, atau GIF.');
  }
}

/** Menyimpan satu gambar dan mengembalikan URL yang bisa dipakai di <img src>. */
export async function saveImage(file: File): Promise<string> {
  assertImage(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = safeExtension(file.name, file.type);

  if (storageMode() === 'local') {
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
      await writeFile(path.join(UPLOAD_DIR, name), buffer);
      return `/uploads/${name}`;
    } catch {
      // Filesystem tidak bisa ditulis — jatuh ke penyimpanan database.
    }
  }

  const blob = await prisma.fileBlob.create({
    data: {
      filename: file.name || `upload${extension}`,
      mimeType: file.type,
      size: buffer.byteLength,
      data: buffer,
    },
    select: { id: true },
  });
  return `/api/files/${blob.id}`;
}

/** Menyimpan beberapa gambar sekaligus, melewati input yang kosong. */
export async function saveImages(files: File[], limit = 5): Promise<string[]> {
  const usable = files.filter((file) => file && file.size > 0).slice(0, limit);
  const urls: string[] = [];
  for (const file of usable) {
    urls.push(await saveImage(file));
  }
  return urls;
}
