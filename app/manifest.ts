import type { MetadataRoute } from 'next';

/**
 * Manifest aplikasi web. Berkas inilah yang membuat KosKu bisa dipasang
 * ke layar utama ponsel dan berjalan tanpa bilah alamat browser.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/kosku',
    name: 'KosKu — Manajemen Kos & Kontrakan',
    short_name: 'KosKu',
    description:
      'Booking kamar, tagihan bulanan, komplain, dan laporan keuangan kos dalam satu aplikasi.',
    start_url: '/kosku',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'id',
    dir: 'ltr',
    categories: ['business', 'productivity', 'finance'],
    background_color: '#fbf9f5',
    theme_color: '#12796b',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Daftar kamar',
        short_name: 'Kamar',
        url: '/kosku/rooms',
      },
      {
        name: 'Masuk',
        short_name: 'Masuk',
        url: '/kosku/login',
      },
    ],
  };
}
