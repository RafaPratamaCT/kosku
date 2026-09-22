import { z } from 'zod';

const usernameRegex = /^[a-z0-9_]+$/;
const phoneRegex = /^(\+?62|0)[0-9]{8,13}$/;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi.').toLowerCase(),
  password: z.string().min(1, 'Password wajib diisi.'),
  next: z.string().optional(),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'Username minimal 3 karakter.')
      .max(24, 'Username maksimal 24 karakter.')
      .regex(usernameRegex, 'Username hanya boleh huruf kecil, angka, dan garis bawah.'),
    password: z
      .string()
      .min(6, 'Password minimal 6 karakter.')
      .max(72, 'Password terlalu panjang.'),
    confirmPassword: z.string(),
    fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.').max(80),
    phone: z.string().trim().regex(phoneRegex, 'Nomor HP tidak valid. Contoh: 081234567890.'),
    email: z.union([z.string().trim().email('Email tidak valid.'), z.literal('')]).optional(),
    occupation: z.string().trim().max(60).optional(),
    emergencyName: z.string().trim().min(3, 'Nama kontak darurat wajib diisi.').max(80),
    emergencyPhone: z.string().trim().regex(phoneRegex, 'Nomor kontak darurat tidak valid.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama.',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.').max(80),
  phone: z.string().trim().regex(phoneRegex, 'Nomor HP tidak valid.'),
  email: z.union([z.string().trim().email('Email tidak valid.'), z.literal('')]).optional(),
  occupation: z.string().trim().max(60).optional(),
  emergencyName: z.string().trim().max(80).optional(),
  emergencyPhone: z
    .union([
      z.string().trim().regex(phoneRegex, 'Nomor kontak darurat tidak valid.'),
      z.literal(''),
    ])
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi.'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter.').max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama.',
    path: ['confirmPassword'],
  });

export const bookingSchema = z.object({
  roomId: z.string().min(1),
  startDate: z
    .string()
    .min(1, 'Tanggal masuk wajib diisi.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal masuk tidak valid.'),
  durationMonths: z.coerce
    .number()
    .int()
    .refine((value) => [1, 3, 6, 12].includes(value), 'Durasi harus 1, 3, 6, atau 12 bulan.'),
});

export const roomSchema = z.object({
  number: z.string().trim().min(1, 'Nomor kamar wajib diisi.').max(12),
  type: z.enum(['STANDARD', 'DELUXE', 'VIP']),
  floor: z.coerce.number().int().min(1, 'Lantai minimal 1.').max(20),
  price: z.coerce.number().int().min(1000, 'Harga minimal Rp 1.000.'),
  size: z.string().trim().min(1, 'Ukuran kamar wajib diisi.').max(24),
  description: z.string().trim().max(2000).optional(),
  facilities: z.array(z.string().trim().min(1)).max(30).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'LOCKED', 'MAINTENANCE']).optional(),
  lockReason: z.string().trim().max(200).optional(),
});

export const complaintSchema = z.object({
  category: z.enum(['Listrik', 'Air', 'AC', 'WiFi', 'Kebersihan', 'Keamanan', 'Lainnya']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  title: z.string().trim().min(5, 'Judul minimal 5 karakter.').max(120),
  description: z.string().trim().min(10, 'Deskripsi minimal 10 karakter.').max(2000),
});

export const complaintReplySchema = z.object({
  complaintId: z.string().min(1),
  message: z.string().trim().min(1, 'Balasan tidak boleh kosong.').max(2000),
});

export const requestSchema = z.object({
  type: z.enum(['EXTEND', 'ROOM_CHANGE', 'CHECKOUT', 'GUEST', 'SERVICE']),
  note: z.string().trim().max(1000).optional(),
  extendMonths: z.coerce.number().int().min(1).max(12).optional(),
  targetRoomId: z.string().optional(),
  checkoutDate: z.string().optional(),
  guestName: z.string().trim().max(80).optional(),
  guestIdNumber: z.string().trim().max(40).optional(),
  guestNights: z.coerce.number().int().min(1).max(14).optional(),
  serviceType: z.enum(['Laundry', 'Galon', 'Parkir Motor', 'Parkir Mobil']).optional(),
  serviceQty: z.coerce.number().int().min(1).max(50).optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter.').max(120),
  content: z.string().trim().min(10, 'Isi pengumuman minimal 10 karakter.').max(4000),
  isPinned: z.coerce.boolean().optional(),
});

export const expenseSchema = z.object({
  category: z.enum(['Listrik', 'Air', 'Internet', 'Perawatan', 'Kebersihan', 'Gaji', 'Lainnya']),
  label: z.string().trim().min(3, 'Keterangan minimal 3 karakter.').max(120),
  amount: z.coerce.number().int().min(1, 'Nominal wajib diisi.'),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal tidak valid.'),
  note: z.string().trim().max(500).optional(),
});

export const billItemSchema = z.object({
  billId: z.string().min(1),
  label: z.string().trim().min(3, 'Keterangan minimal 3 karakter.').max(120),
  amount: z.coerce.number().int().min(1, 'Nominal wajib diisi.'),
  type: z.enum(['RENT', 'ELECTRIC', 'WATER', 'SERVICE', 'FINE']),
});

export const settingsSchema = z.object({
  kosName: z.string().trim().min(2).max(80),
  kosTagline: z.string().trim().max(160).optional(),
  kosAddress: z.string().trim().max(200).optional(),
  kosCity: z.string().trim().max(80).optional(),
  kosMapUrl: z.union([z.string().trim().url('Link peta tidak valid.'), z.literal('')]).optional(),
  ownerName: z.string().trim().max(80).optional(),
  ownerPhone: z.string().trim().max(24).optional(),
  ownerEmail: z.union([z.string().trim().email('Email tidak valid.'), z.literal('')]).optional(),
  bankName: z.string().trim().max(40).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
  bankAccountName: z.string().trim().max(80).optional(),
  defaultDueDay: z.coerce.number().int().min(0).max(28),
  lateFeeType: z.enum(['FIXED', 'PERCENT']),
  lateFeeValue: z.coerce.number().int().min(0),
  depositAmount: z.coerce.number().int().min(0),
  bookingHoldMinutes: z.coerce.number().int().min(5).max(1440),
  rules: z.string().trim().max(4000).optional(),
  checkInTime: z.string().trim().max(10).optional(),
  checkOutTime: z.string().trim().max(10).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
export type RequestInput = z.infer<typeof requestSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Mengubah error Zod menjadi pesan pertama yang ramah dibaca. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Data yang dikirim tidak valid.';
}
