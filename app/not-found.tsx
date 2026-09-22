import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md space-y-5 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">404</p>
        <h1 className="text-3xl font-bold text-ink">Halaman tidak ditemukan</h1>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          Alamat yang Anda buka tidak ada atau sudah dipindahkan.
        </p>
        <div className="pt-2">
          <ButtonLink href="/kosku">Kembali ke beranda</ButtonLink>
        </div>
      </div>
    </main>
  );
}
