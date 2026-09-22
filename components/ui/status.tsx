import type {
  BillStatus,
  BookingStatus,
  ComplaintStatus,
  PaymentStatus,
  Priority,
  RequestStatus,
  RoomStatus,
  RoomType,
  TenancyStatus,
} from '@prisma/client';

import { Badge, Dot } from '@/components/ui/badge';

type Tone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger' | 'info' | 'outline';

function make(label: string, tone: Tone, withDot = true) {
  return (
    <Badge tone={tone}>
      {withDot ? <Dot /> : null}
      {label}
    </Badge>
  );
}

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  AVAILABLE: 'Tersedia',
  OCCUPIED: 'Terisi',
  LOCKED: 'Terkunci',
  MAINTENANCE: 'Perbaikan',
};

export function RoomStatusBadge({ status, held }: { status: RoomStatus; held?: boolean }) {
  if (held && status === 'AVAILABLE') return make('Sedang dihold', 'warn');
  const tones: Record<RoomStatus, Tone> = {
    AVAILABLE: 'success',
    OCCUPIED: 'danger',
    LOCKED: 'neutral',
    MAINTENANCE: 'warn',
  };
  return make(ROOM_STATUS_LABEL[status], tones[status]);
}

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  STANDARD: 'Standard',
  DELUXE: 'Deluxe',
  VIP: 'VIP',
};

export function RoomTypeBadge({ type }: { type: RoomType }) {
  const tones: Record<RoomType, Tone> = {
    STANDARD: 'outline',
    DELUXE: 'info',
    VIP: 'brand',
  };
  return make(ROOM_TYPE_LABEL[type], tones[type], false);
}

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  UNPAID: 'Belum bayar',
  WAITING_VERIFICATION: 'Menunggu verifikasi',
  PAID: 'Lunas',
  OVERDUE: 'Telat',
};

export function BillStatusBadge({ status }: { status: BillStatus }) {
  const tones: Record<BillStatus, Tone> = {
    UNPAID: 'warn',
    WAITING_VERIFICATION: 'info',
    PAID: 'success',
    OVERDUE: 'danger',
  };
  return make(BILL_STATUS_LABEL[status], tones[status]);
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Menunggu bayar',
  PAID: 'Lunas',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const tones: Record<BookingStatus, Tone> = {
    PENDING: 'warn',
    PAID: 'success',
    EXPIRED: 'neutral',
    CANCELLED: 'neutral',
  };
  return make(BOOKING_STATUS_LABEL[status], tones[status]);
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Menunggu',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tones: Record<PaymentStatus, Tone> = {
    PENDING: 'warn',
    VERIFIED: 'success',
    REJECTED: 'danger',
  };
  return make(PAYMENT_STATUS_LABEL[status], tones[status]);
}

export const COMPLAINT_STATUS_LABEL: Record<ComplaintStatus, string> = {
  OPEN: 'Baru',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Selesai',
  CLOSED: 'Ditutup',
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const tones: Record<ComplaintStatus, Tone> = {
    OPEN: 'warn',
    IN_PROGRESS: 'info',
    RESOLVED: 'success',
    CLOSED: 'neutral',
  };
  return make(COMPLAINT_STATUS_LABEL[status], tones[status]);
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const tones: Record<Priority, Tone> = {
    LOW: 'neutral',
    MEDIUM: 'info',
    HIGH: 'danger',
  };
  return make(PRIORITY_LABEL[priority], tones[priority], false);
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const tones: Record<RequestStatus, Tone> = {
    PENDING: 'warn',
    APPROVED: 'success',
    REJECTED: 'danger',
  };
  return make(REQUEST_STATUS_LABEL[status], tones[status]);
}

export const REQUEST_TYPE_LABEL = {
  EXTEND: 'Perpanjang sewa',
  ROOM_CHANGE: 'Pindah kamar',
  CHECKOUT: 'Check-out',
  GUEST: 'Izin tamu menginap',
  SERVICE: 'Layanan tambahan',
} as const;

export const TENANCY_STATUS_LABEL: Record<TenancyStatus, string> = {
  PENDING_PAYMENT: 'Menunggu bayar',
  ACTIVE: 'Aktif',
  ENDED: 'Selesai',
  CANCELLED: 'Batal',
};

export function TenancyStatusBadge({ status }: { status: TenancyStatus }) {
  const tones: Record<TenancyStatus, Tone> = {
    PENDING_PAYMENT: 'warn',
    ACTIVE: 'success',
    ENDED: 'neutral',
    CANCELLED: 'neutral',
  };
  return make(TENANCY_STATUS_LABEL[status], tones[status]);
}

export const BILL_ITEM_TYPE_LABEL = {
  RENT: 'Sewa',
  ELECTRIC: 'Listrik',
  WATER: 'Air',
  SERVICE: 'Layanan',
  FINE: 'Denda',
} as const;
