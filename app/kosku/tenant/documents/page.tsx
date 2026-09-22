import { Check, Download, FileText, ScrollText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ExternalButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { EmptyState, IconBox, PageHeader } from '@/components/ui/misc';
import { requireTenant } from '@/lib/auth';
import { formatDate, formatRupiah } from '@/lib/format';
import { getSettings } from '@/lib/settings';
import { getActiveTenancy, getLatestTenancy } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Dokumen' };

export default async function TenantDocumentsPage() {
  const user = await requireTenant();
  const [active, latest, settings] = await Promise.all([
    getActiveTenancy(user.id),
    getLatestTenancy(user.id),
    getSettings(),
  ]);

  const tenancy = active ?? latest;
  const rules = settings.rules.split('\n').filter(Boolean);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Dokumen"
        description="Kontrak sewa dan aturan kos yang berlaku untuk Anda."
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="space-y-5 p-6">
          <div className="flex items-start gap-3.5">
            <IconBox tone="brand">
              <FileText aria-hidden />
            </IconBox>
            <div className="space-y-1">
              <h2 className="text-[15px] font-semibold text-ink">Kontrak sewa</h2>
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Berisi identitas kedua pihak, jangka waktu, biaya, dan tata tertib.
              </p>
            </div>
          </div>

          {tenancy ? (
            <>
              <div className="space-y-2.5 border-t border-line pt-4 text-[13px]">
                <Row label="Kamar" value={`Kamar ${tenancy.room.number}`} />
                <Row label="Mulai" value={formatDate(tenancy.startDate)} />
                <Row label="Berakhir" value={formatDate(tenancy.endDate)} />
                <Row label="Sewa per bulan" value={formatRupiah(tenancy.monthlyPrice)} />
                <Row label="Deposit" value={formatRupiah(tenancy.depositAmount)} />
              </div>

              <ExternalButtonLink
                href={`/api/documents/contract/${tenancy.id}`}
                className="block w-full"
                target="_blank"
                rel="noreferrer"
              >
                <Download aria-hidden />
                Unduh kontrak PDF
              </ExternalButtonLink>
            </>
          ) : (
            <EmptyState
              title="Belum ada kontrak"
              description="Kontrak akan tersedia setelah Anda resmi menempati kamar."
            />
          )}
        </Card>

        <Card className="space-y-5 p-6">
          <div className="flex items-start gap-3.5">
            <IconBox tone="peach">
              <ScrollText aria-hidden />
            </IconBox>
            <div className="space-y-1">
              <h2 className="text-[15px] font-semibold text-ink">Aturan kos</h2>
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Berlaku untuk seluruh penghuni dan tamu yang berkunjung.
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 border-t border-line pt-4">
            {rules.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {rule}
              </li>
            ))}
          </ul>

          <div className="space-y-2.5 border-t border-line pt-4 text-[13px]">
            <Row label="Jam check-in" value={`Pukul ${settings.checkInTime}`} />
            <Row label="Jam check-out" value={`Pukul ${settings.checkOutTime}`} />
            <Row label="Pemilik kos" value={settings.ownerName} />
            <Row label="Kontak" value={settings.ownerPhone} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
