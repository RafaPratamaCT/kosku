'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { Banknote, Check, Plus, X } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  addBillItemAction,
  recordCashPaymentAction,
  verifyPaymentAction,
} from '@/lib/actions/admin-billing';
import { formatRupiah } from '@/lib/format';

export function AddBillItemForm({ billId }: { billId: string }) {
  const [state, formAction] = useFormState(
    addBillItemAction,
    {} as { error?: string; success?: string },
  );
  const ref = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="space-y-4">
      <input type="hidden" name="billId" value={billId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Keterangan" required htmlFor="label">
          <Input id="label" name="label" required placeholder="Tambahan listrik AC" />
        </Field>
        <Field label="Jenis" required htmlFor="type">
          <Select id="type" name="type" defaultValue="ELECTRIC">
            <option value="RENT">Sewa</option>
            <option value="ELECTRIC">Listrik</option>
            <option value="WATER">Air</option>
            <option value="SERVICE">Layanan</option>
            <option value="FINE">Denda</option>
          </Select>
        </Field>
      </div>

      <Field label="Nominal (Rp)" required htmlFor="amount">
        <Input id="amount" name="amount" type="number" min={1} required placeholder="50000" />
      </Field>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <SubmitButton variant="outline">
        <Plus aria-hidden />
        Tambah biaya
      </SubmitButton>
    </form>
  );
}

export function RecordCashForm({ billId, amount }: { billId: string; amount: number }) {
  const [state, formAction] = useFormState(
    recordCashPaymentAction,
    {} as { error?: string; success?: string },
  );
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <div className="space-y-3">
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}
        <Button variant="soft" className="w-full" onClick={() => setOpen(true)}>
          <Banknote aria-hidden />
          Catat pembayaran tunai
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="billId" value={billId} />
      <Alert tone="info">
        Tagihan akan ditandai lunas sebesar {formatRupiah(amount)} dan penghuni mendapat notifikasi.
      </Alert>
      <Field label="Catatan" htmlFor="note">
        <Textarea
          id="note"
          name="note"
          rows={2}
          className="min-h-[68px]"
          placeholder="Diterima langsung oleh pemilik kos"
        />
      </Field>
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      <div className="flex gap-2">
        <SubmitButton className="flex-1">Tandai lunas</SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}

export function VerifyPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useFormState(
    verifyPaymentAction,
    {} as { error?: string; success?: string },
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="paymentId" value={paymentId} />
      <Textarea
        name="note"
        rows={2}
        className="min-h-[64px]"
        placeholder="Catatan verifikasi (opsional). Kalau ditolak, tulis alasannya di sini."
        aria-label="Catatan verifikasi"
      />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="VERIFIED" size="sm">
          <Check aria-hidden />
          Setujui pembayaran
        </SubmitButton>
        <SubmitButton name="decision" value="REJECTED" size="sm" variant="dangerSoft">
          <X aria-hidden />
          Tolak
        </SubmitButton>
      </div>
    </form>
  );
}
