import { MessageCircle, Sparkles } from 'lucide-react';

import { ExternalButtonLink } from '@/components/ui/button-link';
import { waLink } from '@/lib/format';
import { cn } from '@/lib/utils';

const AUTHOR_NAME = 'Rafa Pratama';
const AUTHOR_PHONE = '082110967403';
const WA_MESSAGE =
  'Halo Kak Rafa, saya lihat website KosKu dan tertarik untuk membuat website seperti ini. Boleh konsultasi dulu?';

/**
 * Kartu kredit pembuat. Dipakai di bagian bawah halaman publik maupun
 * dashboard penghuni dan pengurus.
 */
export function AuthorCredit({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="author-credit-title"
      className={cn(
        'overflow-hidden rounded-2xl border border-line bg-surface shadow-xs',
        className,
      )}
    >
      <div className="flex flex-col gap-6 p-6 sm:p-7 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="flex gap-4">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
            aria-hidden
          >
            <Sparkles className="size-5" />
          </span>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
              Tentang pembuat
            </p>
            <h2 id="author-credit-title" className="text-[15.5px] font-semibold text-ink">
              Website ini dibuat oleh {AUTHOR_NAME}
            </h2>
            <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-muted">
              Tertarik punya website seperti ini untuk kos, usaha, atau kebutuhan lain? Ingin
              berdiskusi dulu soal fitur, tampilan, dan perkiraan biayanya? Silakan hubungi saya —
              konsultasi awal gratis dan tanpa keharusan lanjut.
            </p>
          </div>
        </div>

        <div className="shrink-0 space-y-2 md:text-right">
          <ExternalButtonLink
            href={waLink(AUTHOR_PHONE, WA_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className="w-full md:w-auto"
          >
            <MessageCircle aria-hidden />
            Hubungi via WhatsApp
          </ExternalButtonLink>
          <p className="text-center text-[12px] text-ink-subtle md:text-right">{AUTHOR_PHONE}</p>
        </div>
      </div>
    </section>
  );
}
