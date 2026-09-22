import type { Metadata, Viewport } from 'next';

import { ServiceWorkerRegistrar } from '@/components/service-worker';
import { ToastProvider } from '@/components/ui/toast';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'KosKu — Manajemen Kos & Kontrakan',
    template: '%s · KosKu',
  },
  description:
    'Aplikasi manajemen kos: booking kamar online, tagihan bulanan otomatis, komplain, dan laporan keuangan dalam satu tempat.',
  applicationName: 'KosKu',
  // Membuat iOS membuka KosKu layaknya aplikasi tersendiri ketika
  // dipasang lewat "Tambahkan ke Layar Utama" di Safari.
  appleWebApp: {
    capable: true,
    title: 'KosKu',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#12796b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
