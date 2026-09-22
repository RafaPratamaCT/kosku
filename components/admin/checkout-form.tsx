'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { LogOut } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { checkoutTenantAction } from '@/lib/actions/admin-misc';
import { formatRupiah } from '@/lib/format';

export function CheckoutForm({
  tenancyId,
  depositAmount,
  hasArrears,
}: {
  tenancyId: string;
  depositAmount: number;
  hasArrears: boolean;
}) {
  const [state, formAction] = useFormState(
    checkoutTenantAction,
    {} as { error?: string; success?: string },
  );
  const [confirming, setConfirming] = React.useState(false);

  if (!confirming) {
    return (
      <div className="space-y-3">
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}
        {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
        <Button variant="dangerSoft" className="w-full" onClick={() => setConfirming(true)}>
          <LogOut aria-hidden />
          Proses check-out
        </Button>
        {hasArrears ? (
          <p className="text-[12px] leading-relaxed text-ink-muted">
            Masih ada tagihan yang belum lunas. Selesaikan dulu sebelum check-out.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tenancyId" value={tenancyId} />

      <Alert tone="warn" title="Konfirmasi check-out">
        Masa sewa diakhiri hari ini dan kamar langsung berstatus tersedia.
      </Alert>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-md bg-surface-muted px-4 py-3">
        <Checkbox name="returnDeposit" defaultChecked className="mt-0.5" />
        <span className="text-[13px] leading-relaxed text-ink">
          Deposit {formatRupiah(depositAmount)} sudah dikembalikan ke penghuni
        </span>
      </label>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <div className="flex gap-2">
        <SubmitButton variant="danger" className="flex-1">
          Ya, proses check-out
        </SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
