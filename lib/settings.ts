import 'server-only';

import { prisma } from '@/lib/db';

export type SettingsMap = {
  kosName: string;
  kosTagline: string;
  kosAddress: string;
  kosCity: string;
  kosMapUrl: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  defaultDueDay: string;
  lateFeeType: 'FIXED' | 'PERCENT';
  lateFeeValue: string;
  depositAmount: string;
  bookingHoldMinutes: string;
  rules: string;
  checkInTime: string;
  checkOutTime: string;
};

export const DEFAULT_SETTINGS: SettingsMap = {
  kosName: 'Kos Melati Residence',
  kosTagline: 'Hunian nyaman, tenang, dan dekat ke mana-mana',
  kosAddress: 'Jl. Melati Indah No. 24, Tembalang',
  kosCity: 'Semarang, Jawa Tengah',
  kosMapUrl: 'https://maps.google.com/?q=Tembalang%20Semarang',
  ownerName: 'Ibu Sri Wahyuni',
  ownerPhone: '081234567890',
  ownerEmail: 'admin@kosmelati.id',
  bankName: 'BCA',
  bankAccountNumber: '1234567890',
  bankAccountName: 'Sri Wahyuni',
  defaultDueDay: '0',
  lateFeeType: 'FIXED',
  lateFeeValue: '50000',
  depositAmount: '500000',
  bookingHoldMinutes: '30',
  rules: [
    'Jam malam pukul 23.00, gerbang dikunci otomatis.',
    'Tamu lawan jenis tidak diperbolehkan masuk kamar.',
    'Wajib menjaga kebersihan kamar dan area bersama.',
    'Dilarang merokok di dalam kamar.',
    'Memasak hanya di dapur bersama.',
    'Pembayaran sewa paling lambat tanggal jatuh tempo tiap bulan.',
  ].join('\n'),
  checkInTime: '14.00',
  checkOutTime: '12.00',
};

export async function getSettings(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const map = { ...DEFAULT_SETTINGS } as Record<string, string>;
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map as unknown as SettingsMap;
}

export async function getSetting<K extends keyof SettingsMap>(key: K): Promise<SettingsMap[K]> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return (row?.value ?? DEFAULT_SETTINGS[key]) as SettingsMap[K];
}

export async function saveSettings(
  values: Partial<Record<keyof SettingsMap, string>>,
): Promise<void> {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined) as [
    string,
    string,
  ][];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}

export function numberSetting(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
