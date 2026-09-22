import { PasswordForm } from '@/components/account/profile-forms';
import { SettingsForm } from '@/components/admin/settings-form';
import { Card } from '@/components/ui/card';
import { Alert, PageHeader } from '@/components/ui/misc';
import { requireAdmin } from '@/lib/auth';
import { initials } from '@/lib/format';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Pengaturan' };

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="space-y-7">
      <PageHeader
        title="Pengaturan"
        description="Data kos, rekening pembayaran, aturan tagihan, dan keamanan akun Anda."
      />

      <Alert tone="info" title="Pembayaran masih mode demo">
        QRIS pada aplikasi ini tidak memproses uang sungguhan. Cara menggantinya dengan payment
        gateway asli dijelaskan di berkas README.md.
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <Card className="p-6 sm:p-8">
          <SettingsForm settings={settings} />
        </Card>

        <Card className="space-y-6 p-6">
          <div className="flex items-center gap-3.5">
            <span className="flex size-12 items-center justify-center rounded-lg bg-brand-soft text-[15px] font-bold text-brand-ink">
              {initials(user.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-semibold text-ink">{user.fullName}</p>
              <p className="text-[12.5px] text-ink-muted">@{user.username} · Pemilik kos</p>
            </div>
          </div>

          <div className="space-y-5 border-t border-line pt-5">
            <div className="space-y-1">
              <h2 className="text-[15px] font-semibold text-ink">Ganti password</h2>
              <p className="text-[12.5px] leading-relaxed text-ink-muted">
                Wajib dilakukan sebelum aplikasi dipakai sungguhan. Setelah diganti, semua perangkat
                lain harus masuk ulang.
              </p>
            </div>
            <PasswordForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
