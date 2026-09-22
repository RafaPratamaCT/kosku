import { formatDate } from '@/lib/format';

/** Ringkasan isi pengajuan agar mudah dibaca di tabel. */
export function describeRequest(type: string, payload: unknown): string {
  const data = (payload ?? {}) as Record<string, unknown>;
  switch (type) {
    case 'EXTEND':
      return `Perpanjang ${data.extendMonths ?? '-'} bulan`;
    case 'ROOM_CHANGE':
      return `Pindah ke kamar ${data.targetRoomNumber ?? '-'}`;
    case 'CHECKOUT':
      return data.checkoutDate
        ? `Check-out ${formatDate(new Date(String(data.checkoutDate)))}`
        : 'Check-out';
    case 'GUEST':
      return `${data.guestName ?? 'Tamu'} · ${data.guestNights ?? 1} malam`;
    case 'SERVICE':
      return `${data.serviceType ?? 'Layanan'} × ${data.serviceQty ?? 1}`;
    default:
      return '—';
  }
}
