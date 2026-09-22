'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import type { ActionState } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notify, notifyAdmins } from '@/lib/notifications';
import { saveImages, UploadError } from '@/lib/storage';
import { complaintReplySchema, complaintSchema, firstError } from '@/lib/validations';
import { getActiveTenancy } from '@/lib/tenant';

export async function createComplaintAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== 'TENANT') return { error: 'Hanya penghuni yang bisa mengirim komplain.' };

  const parsed = complaintSchema.safeParse({
    category: formData.get('category'),
    priority: formData.get('priority'),
    title: formData.get('title'),
    description: formData.get('description'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  let photoUrls: string[] = [];
  const photos = formData.getAll('photos').filter((item): item is File => item instanceof File);
  if (photos.length > 0) {
    try {
      photoUrls = await saveImages(photos, 4);
    } catch (error) {
      if (error instanceof UploadError) return { error: `Foto: ${error.message}` };
      return { error: 'Gagal mengunggah foto. Coba lagi.' };
    }
  }

  const tenancy = await getActiveTenancy(user.id);

  const complaint = await prisma.complaint.create({
    data: {
      userId: user.id,
      roomId: tenancy?.roomId ?? null,
      category: parsed.data.category,
      priority: parsed.data.priority,
      title: parsed.data.title,
      description: parsed.data.description,
      photoUrls,
    },
    select: { id: true },
  });

  await notifyAdmins({
    title: 'Komplain baru masuk',
    message: `${user.fullName}: ${parsed.data.title}`,
    link: `/kosku/admin/complaints?open=${complaint.id}`,
  });

  revalidatePath('/kosku/tenant/complaints');
  redirect(`/kosku/tenant/complaints/${complaint.id}`);
}

export async function replyComplaintAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = complaintReplySchema.safeParse({
    complaintId: formData.get('complaintId'),
    message: formData.get('message'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const complaint = await prisma.complaint.findUnique({
    where: { id: parsed.data.complaintId },
    select: { id: true, userId: true, title: true, status: true },
  });
  if (!complaint) return { error: 'Komplain tidak ditemukan.' };

  const isOwner = complaint.userId === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return { error: 'Anda tidak punya akses ke komplain ini.' };

  await prisma.complaintReply.create({
    data: { complaintId: complaint.id, userId: user.id, message: parsed.data.message },
  });

  // Komplain yang sudah ditutup dibuka kembali saat ada balasan baru dari penghuni.
  if (isOwner && complaint.status === 'OPEN') {
    // tetap OPEN
  } else if (isAdmin && complaint.status === 'OPEN') {
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  if (isAdmin) {
    await notify({
      userId: complaint.userId,
      title: 'Balasan komplain',
      message: `Pemilik kos membalas komplain "${complaint.title}".`,
      link: `/kosku/tenant/complaints/${complaint.id}`,
    });
  } else {
    await notifyAdmins({
      title: 'Balasan komplain',
      message: `${user.fullName} membalas komplain "${complaint.title}".`,
      link: `/kosku/admin/complaints?open=${complaint.id}`,
    });
  }

  revalidatePath(`/kosku/tenant/complaints/${complaint.id}`);
  revalidatePath('/kosku/admin/complaints');
  return { success: 'Balasan terkirim.' };
}

export async function updateComplaintStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') return;

  const complaintId = formData.get('complaintId');
  const status = formData.get('status');
  const allowed = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

  if (typeof complaintId !== 'string' || typeof status !== 'string') return;
  if (!allowed.includes(status as (typeof allowed)[number])) return;

  const complaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: { status: status as (typeof allowed)[number] },
    select: { userId: true, title: true },
  });

  const label: Record<string, string> = {
    OPEN: 'dibuka kembali',
    IN_PROGRESS: 'sedang diproses',
    RESOLVED: 'ditandai selesai',
    CLOSED: 'ditutup',
  };

  await notify({
    userId: complaint.userId,
    title: 'Status komplain berubah',
    message: `Komplain "${complaint.title}" ${label[status]}.`,
    link: `/kosku/tenant/complaints/${complaintId}`,
  });

  revalidatePath('/kosku/admin/complaints');
  revalidatePath(`/kosku/tenant/complaints/${complaintId}`);
}
