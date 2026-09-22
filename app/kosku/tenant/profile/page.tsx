import { notFound } from 'next/navigation';

import { PasswordForm, ProfileForm } from '@/components/account/profile-forms';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/misc';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Profil saya' };

export default async function TenantProfilePage() {
  const session = await requireTenant();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      username: true,
      fullName: true,
      phone: true,
      email: true,
      occupation: true,
      emergencyName: true,
      emergencyPhone: true,
      idCardUrl: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-7">
      <PageHeader
        title="Profil saya"
        description="Pastikan data Anda selalu terbaru agar mudah dihubungi saat ada keperluan."
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="space-y-6">
          <Card className="space-y-4 p-6 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-xl bg-brand-soft text-[20px] font-bold text-brand-ink">
              {initials(user.fullName)}
            </span>
            <div className="space-y-1">
              <p className="text-[16px] font-semibold text-ink">{user.fullName}</p>
              <p className="text-[13px] text-ink-muted">@{user.username}</p>
            </div>
            <p className="border-t border-line pt-4 text-[12.5px] text-ink-subtle">
              Bergabung sejak {formatDate(user.createdAt)}
            </p>
          </Card>

          {user.idCardUrl ? (
            <Card className="space-y-3 p-5">
              <p className="text-[13px] font-semibold text-ink">Foto KTP tersimpan</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.idCardUrl}
                alt="Foto KTP"
                className="w-full rounded-md border border-line object-cover"
              />
            </Card>
          ) : null}

          <Card className="space-y-5 p-6">
            <div className="space-y-1">
              <h2 className="text-[15px] font-semibold text-ink">Ganti password</h2>
              <p className="text-[12.5px] leading-relaxed text-ink-muted">
                Setelah diganti, perangkat lain akan diminta masuk ulang.
              </p>
            </div>
            <PasswordForm />
          </Card>
        </div>

        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-ink">Data diri</h2>
            <p className="text-[12.5px] text-ink-muted">
              Username tidak bisa diubah karena dipakai untuk masuk.
            </p>
          </div>
          <ProfileForm
            values={{
              fullName: user.fullName,
              phone: user.phone,
              email: user.email ?? '',
              occupation: user.occupation ?? '',
              emergencyName: user.emergencyName ?? '',
              emergencyPhone: user.emergencyPhone ?? '',
            }}
          />
        </Card>
      </div>
    </div>
  );
}
