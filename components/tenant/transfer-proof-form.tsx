'use client';

import { useFormState } from 'react-dom';

import { Alert } from '@/components/ui/misc';
import { Field, FileInput, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { uploadTransferProofAction } from '@/lib/actions/bills';

export function TransferProofForm({
  billId,
  bank,
}: {
  billId: string;
  bank: { name: string; number: string; holder: string };
}) {
  const [state, formAction] = useFormState(
    uploadTransferProofAction,
    {} as { error?: string; success?: string },
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="billId" value={billId} />

      <div className="space-y-1.5 rounded-lg bg-surface-muted px-4 py-3.5 text-[13px]">
        <p className="font-semibold text-ink">Transfer ke rekening</p>
        <p className="text-ink-muted">
          {bank.name} · <span className="font-semibold text-ink">{bank.number}</span>
        </p>
        <p className="text-ink-muted">a.n. {bank.holder}</p>
      </div>

      <Field
        label="Bukti transfer"
        required
        htmlFor="proof"
        hint="Foto atau tangkapan layar, maksimal 5 MB."
      >
        <FileInput id="proof" name="proof" accept="image/*" required />
      </Field>

      <Field label="Catatan" htmlFor="note" hint="Opsional, misalnya nama pengirim.">
        <Textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Transfer dari rekening atas nama..."
          className="min-h-[84px]"
        />
      </Field>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <SubmitButton className="w-full">Kirim bukti transfer</SubmitButton>
    </form>
  );
}
