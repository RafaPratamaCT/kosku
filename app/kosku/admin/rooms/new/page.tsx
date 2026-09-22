import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { RoomForm } from '@/components/admin/room-form';
import { Card } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Tambah kamar' };

export default async function NewRoomPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/kosku/admin/rooms"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar kamar
        </Link>
        <div className="space-y-1.5">
          <h1 className="text-[24px] font-bold leading-tight text-ink">Tambah kamar baru</h1>
          <p className="max-w-2xl text-[14px] leading-relaxed text-ink-muted">
            Isi data kamar selengkap mungkin. Kamar berstatus tersedia langsung muncul di halaman
            publik dan bisa dibooking calon penghuni.
          </p>
        </div>
      </div>

      <Card className="max-w-4xl p-6 sm:p-8">
        <RoomForm />
      </Card>
    </div>
  );
}
