'use server';

import { revalidatePath } from 'next/cache';

import type { ActionState } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatPeriod, formatRupiah } from '@/lib/format';
import { notifyAdmins } from '@/lib/notifications';
import { saveImage, UploadError } from '@/lib/storage';

/**
 * Penghuni mengunggah bukti transfer. Tagihan berpindah ke status
 * menunggu verifikasi sampai admin menyetujuinya.
 */
export async function uploadTransferProofAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const billId = formData.get('billId');
  if (typeof billId !== 'string' || !billId) {
    return { error: 'Tagihan tidak dikenali.' };
  }

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { tenancy: { select: { userId: true } } },
  });
  if (!bill) return { error: 'Tagihan tidak ditemukan.' };
  // Pemeriksaan kepemilikan di sisi server, bukan hanya di tampilan.
  if (bill.tenancy.userId !== user.id) return { error: 'Anda tidak punya akses ke tagihan ini.' };
  if (bill.status === 'PAID') return { error: 'Tagihan ini sudah lunas.' };
  if (bill.status === 'WAITING_VERIFICATION') {
    return { error: 'Bukti transfer sebelumnya masih menunggu verifikasi.' };
  }

  const proof = formData.get('proof');
  if (!(proof instanceof File) || proof.size === 0) {
    return { error: 'Bukti transfer wajib diunggah.' };
  }

  let proofUrl: string;
  try {
    proofUrl = await saveImage(proof);
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    return { error: 'Gagal mengunggah bukti transfer. Coba lagi.' };
  }

  const note = formData.get('note');

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        billId: bill.id,
        amount: bill.totalAmount,
        method: 'TRANSFER',
        status: 'PENDING',
        proofUrl,
        note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null,
      },
    }),
    prisma.bill.update({
      where: { id: bill.id },
      data: { status: 'WAITING_VERIFICATION' },
    }),
  ]);

  await notifyAdmins({
    title: 'Bukti transfer masuk',
    message: `${user.fullName} mengunggah bukti transfer ${formatRupiah(bill.totalAmount)} untuk ${formatPeriod(bill.period)}.`,
    link: `/kosku/admin/bills/${bill.id}`,
  });

  revalidatePath(`/kosku/tenant/bills/${bill.id}`);
  revalidatePath('/kosku/tenant/bills');
  return { success: 'Bukti transfer terkirim. Menunggu verifikasi pemilik kos.' };
}
