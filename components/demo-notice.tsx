import { TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Pemberitahuan bahwa aplikasi ini hanya contoh. Ditampilkan di halaman
 * publik maupun dashboard penghuni dan pengurus.
 */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-warn/25 bg-warn-soft px-4 py-3',
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-[18px] shrink-0 text-warn" aria-hidden />
      <p className="text-[13px] leading-relaxed text-warn">
        <span className="font-semibold">Mode demo.</span> Website ini dibuat sebagai contoh
        portofolio. Seluruh data kamar, penghuni, tagihan, dan laporan di dalamnya hanyalah data
        fiktif, dan pembayaran QRIS-nya tidak memproses uang sungguhan.
      </p>
    </div>
  );
}

/** Versi pita tipis untuk dipasang di bagian paling atas halaman publik. */
export function DemoNoticeBar() {
  return (
    <div role="note" className="border-b border-warn/20 bg-warn-soft">
      <div className="container flex items-center justify-center gap-2 py-2 text-center">
        <TriangleAlert className="size-[15px] shrink-0 text-warn" aria-hidden />
        <p className="text-[12.5px] leading-snug text-warn">
          <span className="font-semibold">Mode demo</span> — website contoh portofolio. Semua data
          fiktif dan pembayaran tidak memproses uang sungguhan.
        </p>
      </div>
    </div>
  );
}
