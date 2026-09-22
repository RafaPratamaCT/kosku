const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID');

export function formatRupiah(value: number): string {
  return rupiahFormatter.format(Math.round(value));
}

/** Versi ringkas untuk kartu statistik: Rp 12,5 jt */
export function formatRupiahShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `Rp ${numberFormatter.format(Number((value / 1_000_000_000).toFixed(1)))} M`;
  }
  if (abs >= 1_000_000) {
    return `Rp ${numberFormatter.format(Number((value / 1_000_000).toFixed(1)))} jt`;
  }
  if (abs >= 1_000) {
    return `Rp ${numberFormatter.format(Number((value / 1_000).toFixed(0)))} rb`;
  }
  return formatRupiah(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateLong(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${DAYS[date.getDay()]}, ${formatDate(date)}`;
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatDateShort(date)} · ${hh}.${mm}`;
}

/** "2026-03" -> "Maret 2026" */
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const index = Number(month) - 1;
  if (!year || Number.isNaN(index) || index < 0 || index > 11) return period;
  return `${MONTHS[index]} ${year}`;
}

export function formatPeriodShort(period: string): string {
  const [year, month] = period.split('-');
  const index = Number(month) - 1;
  if (!year || Number.isNaN(index) || index < 0 || index > 11) return period;
  return `${MONTHS_SHORT[index]} ${year.slice(2)}`;
}

/** "3 hari lagi", "2 hari lalu", "hari ini" */
export function formatRelativeDays(days: number): string {
  if (days === 0) return 'hari ini';
  if (days === 1) return 'besok';
  if (days === -1) return 'kemarin';
  if (days > 0) return `${days} hari lagi`;
  return `${Math.abs(days)} hari lalu`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return `+${digits}`;
  return phone;
}

export function waLink(phone: string, text?: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${query}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
