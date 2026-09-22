'use client';

import { useFormState } from 'react-dom';
import { Check, X } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { decideRequestAction } from '@/lib/actions/requests';

export function RequestDecision({ requestId }: { requestId: string }) {
  const [state, formAction] = useFormState(
    decideRequestAction,
    {} as { error?: string; success?: string },
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <Textarea
        name="adminNote"
        rows={2}
        className="min-h-[64px]"
        placeholder="Catatan untuk penghuni (opsional)"
        aria-label="Catatan keputusan"
      />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="APPROVED" size="sm">
          <Check aria-hidden />
          Setujui
        </SubmitButton>
        <SubmitButton name="decision" value="REJECTED" size="sm" variant="dangerSoft">
          <X aria-hidden />
          Tolak
        </SubmitButton>
      </div>
    </form>
  );
}
