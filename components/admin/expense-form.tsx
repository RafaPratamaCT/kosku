'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { Plus } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { createExpenseAction } from '@/lib/actions/admin-billing';

const CATEGORIES = ['Listrik', 'Air', 'Internet', 'Perawatan', 'Kebersihan', 'Gaji', 'Lainnya'];

export function ExpenseForm({ today }: { today: string }) {
  const [state, formAction] = useFormState(
    createExpenseAction,
    {} as { error?: string; success?: string },
  );
  const ref = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" required htmlFor="category">
          <Select id="category" name="category" defaultValue="Listrik">
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tanggal" required htmlFor="date">
          <Input id="date" name="date" type="date" required defaultValue={today} />
        </Field>
      </div>

      <Field label="Keterangan" required htmlFor="label">
        <Input id="label" name="label" required placeholder="Tagihan listrik bulanan" />
      </Field>

      <Field label="Nominal (Rp)" required htmlFor="amount">
        <Input id="amount" name="amount" type="number" min={1} required placeholder="2000000" />
      </Field>

      <Field label="Catatan" htmlFor="note">
        <Textarea id="note" name="note" rows={2} className="min-h-[64px]" />
      </Field>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <SubmitButton>
        <Plus aria-hidden />
        Catat pengeluaran
      </SubmitButton>
    </form>
  );
}
