import QRCode from 'qrcode';

/**
 * Lapisan abstraksi pembayaran.
 *
 * Seluruh aplikasi hanya berbicara dengan interface `PaymentProvider`.
 * Saat ini implementasinya `DemoQrisProvider` yang TIDAK memproses uang
 * sungguhan. Untuk pindah ke gateway asli (Midtrans, Xendit, dan sejenisnya),
 * tambahkan implementasi baru di folder ini lalu ganti pilihan di
 * `getPaymentProvider()` — tidak ada kode lain yang perlu diubah.
 */

export type ChargeTarget =
  | { kind: 'BOOKING'; bookingId: string }
  | { kind: 'BILL'; billId: string };

export type CreateChargeInput = {
  amount: number;
  description: string;
  target: ChargeTarget;
  expiresInMinutes?: number;
  /** Diisi saat menampilkan ulang QR yang sudah pernah dibuat. */
  reference?: string;
  expiresAt?: Date;
};

export type Charge = {
  /** Referensi unik transaksi di sisi provider. */
  reference: string;
  amount: number;
  /** Payload mentah yang di-encode menjadi QR. */
  payload: string;
  /** Gambar QR siap pakai (data URL PNG). */
  qrImageDataUrl: string;
  expiresAt: Date;
  isDemo: boolean;
};

export type CallbackInput = {
  qrisRef: string;
  status: string;
  amount: number;
  signature?: string;
};

export type CallbackResult = {
  reference: string;
  amount: number;
  paid: boolean;
};

export class PaymentError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PaymentError';
    this.status = status;
  }
}

export interface PaymentProvider {
  readonly name: string;
  readonly isDemo: boolean;
  createCharge(input: CreateChargeInput): Promise<Charge>;
  verifyCallback(input: CallbackInput): Promise<CallbackResult>;
}

/** Mengubah nilai menjadi field QR ala EMVCo: id + panjang + isi. */
function emvField(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** CRC16-CCITT, dipakai QRIS asli sebagai penutup payload. */
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function randomReference(prefix: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random.slice(0, 10).toUpperCase()}`;
}

export class DemoQrisProvider implements PaymentProvider {
  readonly name = 'DEMO_QRIS';

  readonly isDemo = true;

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new PaymentError('Nominal pembayaran tidak valid.');
    }

    const prefix = input.target.kind === 'BOOKING' ? 'BOOK' : 'BILL';
    const reference = input.reference ?? randomReference(prefix);
    const minutes = input.expiresInMinutes ?? 30;
    const expiresAt = input.expiresAt ?? new Date(Date.now() + minutes * 60 * 1000);

    // Struktur mirip QRIS sungguhan supaya QR terbaca rapi oleh pemindai,
    // tetapi merchant-nya sengaja diberi nama KOSKU-DEMO.
    const base =
      emvField('00', '01') +
      emvField('01', '12') +
      emvField('26', emvField('00', 'ID.KOSKU.DEMO') + emvField('01', reference)) +
      emvField('52', '6513') +
      emvField('53', '360') +
      emvField('54', String(Math.round(input.amount))) +
      emvField('58', 'ID') +
      emvField('59', 'KOSKU-DEMO') +
      emvField('60', 'INDONESIA') +
      emvField('62', emvField('05', reference)) +
      '6304';

    const payload = base + crc16(base);

    const qrImageDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
      color: { dark: '#0F1E2E', light: '#FFFFFF' },
    });

    return {
      reference,
      amount: Math.round(input.amount),
      payload,
      qrImageDataUrl,
      expiresAt,
      isDemo: true,
    };
  }

  async verifyCallback(input: CallbackInput): Promise<CallbackResult> {
    if (!input.qrisRef || typeof input.qrisRef !== 'string') {
      throw new PaymentError('qrisRef wajib diisi.');
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new PaymentError('amount tidak valid.');
    }

    const status = String(input.status ?? '').toUpperCase();
    const paidStatuses = ['PAID', 'SUCCESS', 'SETTLEMENT', 'CAPTURE'];

    // Gateway asli memverifikasi tanda tangan di sini. Mode demo hanya
    // memastikan bentuk datanya benar.
    return {
      reference: input.qrisRef,
      amount: Math.round(input.amount),
      paid: paidStatuses.includes(status),
    };
  }
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!cached) {
    // Ganti baris ini dengan `new MidtransProvider(...)` saat pindah ke gateway asli.
    cached = new DemoQrisProvider();
  }
  return cached;
}
