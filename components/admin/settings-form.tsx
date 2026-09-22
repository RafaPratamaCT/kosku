'use client';

import { useFormState } from 'react-dom';

import { Alert } from '@/components/ui/misc';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { saveSettingsAction } from '@/lib/actions/admin-misc';
import type { SettingsMap } from '@/lib/settings';

export function SettingsForm({ settings }: { settings: SettingsMap }) {
  const [state, formAction] = useFormState(
    saveSettingsAction,
    {} as { error?: string; success?: string },
  );

  return (
    <form action={formAction} className="space-y-8">
      <Section
        title="Informasi kos"
        description="Ditampilkan di halaman publik, invoice, dan kontrak sewa."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama kos" required htmlFor="kosName">
            <Input id="kosName" name="kosName" required defaultValue={settings.kosName} />
          </Field>
          <Field label="Tagline" htmlFor="kosTagline">
            <Input id="kosTagline" name="kosTagline" defaultValue={settings.kosTagline} />
          </Field>
          <Field label="Alamat" htmlFor="kosAddress">
            <Input id="kosAddress" name="kosAddress" defaultValue={settings.kosAddress} />
          </Field>
          <Field label="Kota" htmlFor="kosCity">
            <Input id="kosCity" name="kosCity" defaultValue={settings.kosCity} />
          </Field>
          <Field label="Link Google Maps" htmlFor="kosMapUrl" className="sm:col-span-2">
            <Input id="kosMapUrl" name="kosMapUrl" defaultValue={settings.kosMapUrl} />
          </Field>
          <Field label="Jam check-in" htmlFor="checkInTime">
            <Input id="checkInTime" name="checkInTime" defaultValue={settings.checkInTime} />
          </Field>
          <Field label="Jam check-out" htmlFor="checkOutTime">
            <Input id="checkOutTime" name="checkOutTime" defaultValue={settings.checkOutTime} />
          </Field>
        </div>
      </Section>

      <Section title="Kontak pemilik" description="Dipakai untuk tombol WhatsApp dan footer.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Nama pemilik" htmlFor="ownerName">
            <Input id="ownerName" name="ownerName" defaultValue={settings.ownerName} />
          </Field>
          <Field label="Nomor HP" htmlFor="ownerPhone">
            <Input id="ownerPhone" name="ownerPhone" defaultValue={settings.ownerPhone} />
          </Field>
          <Field label="Email" htmlFor="ownerEmail">
            <Input id="ownerEmail" name="ownerEmail" defaultValue={settings.ownerEmail} />
          </Field>
        </div>
      </Section>

      <Section
        title="Rekening pembayaran"
        description="Ditampilkan saat penghuni memilih transfer bank."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Nama bank" htmlFor="bankName">
            <Input id="bankName" name="bankName" defaultValue={settings.bankName} />
          </Field>
          <Field label="Nomor rekening" htmlFor="bankAccountNumber">
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              defaultValue={settings.bankAccountNumber}
            />
          </Field>
          <Field label="Atas nama" htmlFor="bankAccountName">
            <Input
              id="bankAccountName"
              name="bankAccountName"
              defaultValue={settings.bankAccountName}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Aturan tagihan & booking"
        description="Menentukan jatuh tempo, denda, deposit, dan lama kamar dikunci saat booking."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Tanggal jatuh tempo"
            required
            htmlFor="defaultDueDay"
            hint="Isi 0 untuk mengikuti tanggal check-in tiap penghuni."
          >
            <Input
              id="defaultDueDay"
              name="defaultDueDay"
              type="number"
              min={0}
              max={28}
              required
              defaultValue={settings.defaultDueDay}
            />
          </Field>

          <Field label="Jenis denda" required htmlFor="lateFeeType">
            <Select id="lateFeeType" name="lateFeeType" defaultValue={settings.lateFeeType}>
              <option value="FIXED">Nominal tetap (Rp)</option>
              <option value="PERCENT">Persen dari tagihan (%)</option>
            </Select>
          </Field>

          <Field label="Besar denda" required htmlFor="lateFeeValue">
            <Input
              id="lateFeeValue"
              name="lateFeeValue"
              type="number"
              min={0}
              required
              defaultValue={settings.lateFeeValue}
            />
          </Field>

          <Field label="Deposit (Rp)" required htmlFor="depositAmount">
            <Input
              id="depositAmount"
              name="depositAmount"
              type="number"
              min={0}
              step={50000}
              required
              defaultValue={settings.depositAmount}
            />
          </Field>

          <Field
            label="Durasi hold booking (menit)"
            required
            htmlFor="bookingHoldMinutes"
            hint="Lama kamar dikunci sambil menunggu pembayaran."
          >
            <Input
              id="bookingHoldMinutes"
              name="bookingHoldMinutes"
              type="number"
              min={5}
              max={1440}
              required
              defaultValue={settings.bookingHoldMinutes}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Aturan kos"
        description="Satu aturan per baris. Tampil di halaman publik, dokumen penghuni, dan kontrak."
      >
        <Field htmlFor="rules">
          <Textarea id="rules" name="rules" rows={8} defaultValue={settings.rules} />
        </Field>
      </Section>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton size="lg" className="shadow-lift">
          Simpan pengaturan
        </SubmitButton>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-b border-line pb-8 last:border-b-0 last:pb-0">
      <div className="space-y-1">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="text-[12.5px] leading-relaxed text-ink-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
