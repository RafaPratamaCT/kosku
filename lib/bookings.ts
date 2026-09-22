import 'server-only';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { notify, notifyAdmins } from '@/lib/notifications';
import { getSettings, numberSetting } from '@/lib/settings';
import { addMonths, periodOf } from '@/lib/utils';
import { formatPeriod, formatRupiah } from '@/lib/format';

export class BookingError extends Error {}

/**
 * Menandai booking yang masa hold-nya habis sebagai EXPIRED dan
 * mengembalikan kamar ke status AVAILABLE.
 * Dipanggil oleh /api/cron/expire-bookings dan setiap kali daftar kamar dibuka.
 */
export async function expireStaleBookings(): Promise<number> {
  const now = new Date();
  const stale = await prisma.booking.findMany({
    where: { status: 'PENDING', holdUntil: { lt: now } },
    select: { id: true, roomId: true },
  });
  if (stale.length === 0) return 0;

  const roomIds = Array.from(new Set(stale.map((booking) => booking.roomId)));

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: stale.map((booking) => booking.id) } },
      data: { status: 'EXPIRED' },
    }),
    // Kamar hanya dikembalikan bila memang tidak sedang ditempati,
    // dikunci admin, atau dalam perbaikan.
    prisma.room.updateMany({
      where: { id: { in: roomIds }, status: { notIn: ['OCCUPIED', 'LOCKED', 'MAINTENANCE'] } },
      data: { status: 'AVAILABLE' },
    }),
  ]);

  return stale.length;
}

/** Id kamar yang sedang dihold booking yang belum dibayar. */
export async function heldRoomIds(): Promise<Set<string>> {
  const rows = await prisma.booking.findMany({
    where: { status: 'PENDING', holdUntil: { gte: new Date() } },
    select: { roomId: true },
  });
  return new Set(rows.map((row) => row.roomId));
}

export type BookingQuote = {
  monthlyPrice: number;
  durationMonths: number;
  rentTotal: number;
  depositAmount: number;
  total: number;
  startDate: Date;
  endDate: Date;
};

export async function quoteBooking(
  monthlyPrice: number,
  durationMonths: number,
  startDate: Date,
): Promise<BookingQuote> {
  const settings = await getSettings();
  const depositAmount = numberSetting(settings.depositAmount, 0);
  const rentTotal = monthlyPrice * durationMonths;
  return {
    monthlyPrice,
    durationMonths,
    rentTotal,
    depositAmount,
    total: rentTotal + depositAmount,
    startDate,
    endDate: addMonths(startDate, durationMonths),
  };
}

/**
 * Membuat booking baru. Pengecekan ketersediaan kamar dan pembuatan
 * booking berjalan dalam satu transaksi supaya dua orang tidak bisa
 * mengambil kamar yang sama bersamaan.
 */
export async function createBooking(params: {
  userId: string;
  roomId: string;
  startDate: Date;
  durationMonths: number;
}): Promise<string> {
  await expireStaleBookings();
  const settings = await getSettings();
  const holdMinutes = numberSetting(settings.bookingHoldMinutes, 30);
  const deposit = numberSetting(settings.depositAmount, 0);

  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { id: params.roomId } });
    if (!room) throw new BookingError('Kamar tidak ditemukan.');
    if (room.status !== 'AVAILABLE') {
      throw new BookingError('Kamar ini sudah tidak tersedia.');
    }

    const held = await tx.booking.findFirst({
      where: { roomId: params.roomId, status: 'PENDING', holdUntil: { gte: new Date() } },
      select: { id: true, userId: true },
    });
    if (held && held.userId !== params.userId) {
      throw new BookingError('Kamar ini sedang dipesan orang lain. Coba beberapa saat lagi.');
    }

    const activeTenancy = await tx.tenancy.findFirst({
      where: { userId: params.userId, status: { in: ['ACTIVE', 'PENDING_PAYMENT'] } },
      select: { id: true },
    });
    if (activeTenancy) {
      throw new BookingError(
        'Akun Anda masih punya sewa yang berjalan. Ajukan pindah kamar lewat menu Pengajuan.',
      );
    }

    if (held) {
      await tx.booking.update({ where: { id: held.id }, data: { status: 'CANCELLED' } });
    }

    const booking = await tx.booking.create({
      data: {
        userId: params.userId,
        roomId: params.roomId,
        startDate: params.startDate,
        durationMonths: params.durationMonths,
        totalAmount: room.price * params.durationMonths + deposit,
        holdUntil: new Date(Date.now() + holdMinutes * 60 * 1000),
        status: 'PENDING',
      },
      select: { id: true },
    });

    return booking.id;
  });
}

/**
 * Menyelesaikan booking setelah pembayaran berhasil — tanpa persetujuan admin.
 * Semua perubahan dilakukan dalam satu transaksi agar tidak ada data setengah jadi.
 */
export async function confirmBookingPayment(params: {
  bookingId: string;
  qrisRef: string;
  amount: number;
}): Promise<{ alreadyPaid: boolean; userId: string }> {
  const settings = await getSettings();
  const deposit = numberSetting(settings.depositAmount, 0);

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: params.bookingId },
      include: { room: true, user: { select: { id: true, fullName: true, role: true } } },
    });
    if (!booking) throw new BookingError('Booking tidak ditemukan.');

    if (booking.status === 'PAID') {
      return { alreadyPaid: true, userId: booking.userId, roomNumber: booking.room.number };
    }
    if (booking.status !== 'PENDING') {
      throw new BookingError('Booking sudah tidak berlaku. Silakan pesan ulang kamarnya.');
    }
    if (booking.totalAmount !== params.amount) {
      throw new BookingError('Nominal pembayaran tidak sesuai dengan tagihan booking.');
    }

    const startDate = booking.startDate;
    const endDate = addMonths(startDate, booking.durationMonths);

    await tx.booking.update({ where: { id: booking.id }, data: { status: 'PAID' } });
    await tx.room.update({ where: { id: booking.roomId }, data: { status: 'OCCUPIED' } });
    await tx.user.update({ where: { id: booking.userId }, data: { role: 'TENANT' } });

    const tenancy = await tx.tenancy.create({
      data: {
        userId: booking.userId,
        roomId: booking.roomId,
        startDate,
        endDate,
        durationMonths: booking.durationMonths,
        monthlyPrice: booking.room.price,
        depositAmount: deposit,
        status: 'ACTIVE',
      },
    });

    // Sewa dibayar di muka untuk seluruh durasi, jadi setiap bulan dalam
    // masa sewa langsung dibuatkan tagihan berstatus LUNAS. Deposit
    // dicatat sebagai rincian pada tagihan bulan pertama.
    for (let index = 0; index < booking.durationMonths; index += 1) {
      const periodDate = addMonths(startDate, index);
      const items: Prisma.BillItemCreateManyBillInput[] = [
        { label: `Sewa kamar ${booking.room.number}`, amount: booking.room.price, type: 'RENT' },
      ];
      if (index === 0 && deposit > 0) {
        items.push({
          label: 'Deposit (dikembalikan saat check-out)',
          amount: deposit,
          type: 'SERVICE',
        });
      }
      const total = items.reduce((sum, item) => sum + item.amount, 0);

      const bill = await tx.bill.create({
        data: {
          tenancyId: tenancy.id,
          period: periodOf(periodDate),
          dueDate: periodDate,
          baseAmount: total,
          lateFee: 0,
          totalAmount: total,
          status: 'PAID',
          paidAt: new Date(),
          items: { createMany: { data: items } },
        },
        select: { id: true, totalAmount: true },
      });

      if (index === 0) {
        // Baris pembayaran sudah dibuat saat QR diterbitkan — tinggal dilunasi.
        const pending = await tx.payment.findUnique({ where: { qrisRef: params.qrisRef } });
        if (pending) {
          await tx.payment.update({
            where: { id: pending.id },
            data: {
              billId: bill.id,
              amount: bill.totalAmount,
              status: 'VERIFIED',
              paidAt: new Date(),
              verifiedAt: new Date(),
              note: 'Pembayaran booking via QRIS demo',
            },
          });
        } else {
          await tx.payment.create({
            data: {
              billId: bill.id,
              bookingId: booking.id,
              amount: bill.totalAmount,
              method: 'QRIS_DEMO',
              status: 'VERIFIED',
              qrisRef: params.qrisRef,
              paidAt: new Date(),
              verifiedAt: new Date(),
              note: 'Pembayaran booking via QRIS demo',
            },
          });
        }
      } else {
        await tx.payment.create({
          data: {
            billId: bill.id,
            amount: bill.totalAmount,
            method: 'QRIS_DEMO',
            status: 'VERIFIED',
            qrisRef: `${params.qrisRef}-M${index + 1}`,
            paidAt: new Date(),
            verifiedAt: new Date(),
            note: 'Dibayar di muka saat booking',
          },
        });
      }
    }

    return { alreadyPaid: false, userId: booking.userId, roomNumber: booking.room.number };
  });

  if (!result.alreadyPaid) {
    const tenant = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { fullName: true },
    });

    await notify({
      userId: result.userId,
      title: 'Pembayaran berhasil',
      message: `Selamat datang! Kamar ${result.roomNumber} resmi jadi milik Anda mulai hari ini.`,
      link: '/kosku/tenant',
    });
    await notifyAdmins({
      title: 'Penghuni baru masuk',
      message: `${tenant?.fullName ?? 'Penghuni baru'} menempati kamar ${result.roomNumber}.`,
      link: '/kosku/admin/tenants',
    });
  }

  return { alreadyPaid: result.alreadyPaid, userId: result.userId };
}

/** Menyelesaikan pembayaran satu tagihan bulanan lewat QRIS demo. */
export async function confirmBillPayment(params: {
  billId: string;
  qrisRef: string;
  amount: number;
}): Promise<{ alreadyPaid: boolean }> {
  const result = await prisma.$transaction(async (tx) => {
    const bill = await tx.bill.findUnique({
      where: { id: params.billId },
      include: { tenancy: { include: { user: { select: { id: true, fullName: true } } } } },
    });
    if (!bill) throw new BookingError('Tagihan tidak ditemukan.');
    if (bill.status === 'PAID') return { alreadyPaid: true, bill };
    if (bill.totalAmount !== params.amount) {
      throw new BookingError('Nominal pembayaran tidak sesuai dengan tagihan.');
    }

    await tx.bill.update({
      where: { id: bill.id },
      data: { status: 'PAID', paidAt: new Date() },
    });
    const pending = await tx.payment.findUnique({ where: { qrisRef: params.qrisRef } });
    if (pending) {
      await tx.payment.update({
        where: { id: pending.id },
        data: {
          billId: bill.id,
          amount: bill.totalAmount,
          status: 'VERIFIED',
          paidAt: new Date(),
          verifiedAt: new Date(),
          note: 'Pembayaran tagihan via QRIS demo',
        },
      });
    } else {
      await tx.payment.create({
        data: {
          billId: bill.id,
          amount: bill.totalAmount,
          method: 'QRIS_DEMO',
          status: 'VERIFIED',
          qrisRef: params.qrisRef,
          paidAt: new Date(),
          verifiedAt: new Date(),
          note: 'Pembayaran tagihan via QRIS demo',
        },
      });
    }

    return { alreadyPaid: false, bill };
  });

  if (!result.alreadyPaid) {
    await notify({
      userId: result.bill.tenancy.userId,
      title: 'Tagihan lunas',
      message: `Tagihan ${formatPeriod(result.bill.period)} sebesar ${formatRupiah(result.bill.totalAmount)} sudah lunas.`,
      link: `/kosku/tenant/bills/${result.bill.id}`,
    });
    await notifyAdmins({
      title: 'Pembayaran masuk',
      message: `${result.bill.tenancy.user.fullName} melunasi tagihan ${formatPeriod(result.bill.period)}.`,
      link: `/kosku/admin/bills/${result.bill.id}`,
    });
  }

  return { alreadyPaid: result.alreadyPaid };
}
