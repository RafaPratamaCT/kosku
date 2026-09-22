'use client';

import * as React from 'react';

/**
 * Mendaftarkan service worker sesudah halaman selesai dimuat. Kehadiran
 * service worker inilah yang membuat browser menawarkan pemasangan
 * aplikasi ke layar utama ponsel.
 */
export function ServiceWorkerRegistrar() {
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
