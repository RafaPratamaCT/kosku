import type { Metadata, Viewport } from 'next';

import { ToastProvider } from '@/components/ui/toast';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'KosKu — Manajemen Kos & Kontrakan',
    template: '%s · KosKu',
  },
  description:
    'Aplikasi manajemen kos: booking kamar online, tagihan bulanan otomatis, komplain, dan laporan keuangan dalam satu tempat.',
};

export const viewport: Viewport = {
  themeColor: '#0f766e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
