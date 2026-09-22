import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

import { AuthorCredit } from '@/components/author-credit';
import type { SettingsMap } from '@/lib/settings';
import { waLink } from '@/lib/format';

export function SiteFooter({ settings }: { settings: SettingsMap }) {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container grid gap-10 pb-10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-brand text-[15px] font-bold text-white">
              K
            </span>
            <span className="text-[15px] font-bold text-ink">{settings.kosName}</span>
          </div>
          <p className="max-w-xs text-[13.5px] leading-relaxed text-ink-muted">
            {settings.kosTagline}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[13px] font-semibold text-ink">Navigasi</p>
          <ul className="space-y-2 text-[13.5px] text-ink-muted">
            <li>
              <Link href="/kosku/rooms" className="transition hover:text-ink">
                Daftar kamar
              </Link>
            </li>
            <li>
              <Link href="/kosku#fasilitas" className="transition hover:text-ink">
                Fasilitas
              </Link>
            </li>
            <li>
              <Link href="/kosku#aturan" className="transition hover:text-ink">
                Aturan kos
              </Link>
            </li>
            <li>
              <Link href="/kosku#faq" className="transition hover:text-ink">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-[13px] font-semibold text-ink">Akun</p>
          <ul className="space-y-2 text-[13.5px] text-ink-muted">
            <li>
              <Link href="/kosku/login" className="transition hover:text-ink">
                Masuk
              </Link>
            </li>
            <li>
              <Link href="/kosku/register" className="transition hover:text-ink">
                Daftar akun
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-[13px] font-semibold text-ink">Kontak</p>
          <ul className="space-y-2.5 text-[13.5px] text-ink-muted">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
              <span>
                {settings.kosAddress}
                <br />
                {settings.kosCity}
              </span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
              <a
                href={waLink(settings.ownerPhone)}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-ink"
              >
                {settings.ownerPhone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
              <a href={`mailto:${settings.ownerEmail}`} className="transition hover:text-ink">
                {settings.ownerEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container pb-12">
        <AuthorCredit />
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col gap-2 py-5 text-[12.5px] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.kosName}. Dikelola dengan KosKu.
          </p>
          <p>Pembayaran pada aplikasi ini memakai QRIS mode demo.</p>
        </div>
      </div>
    </footer>
  );
}