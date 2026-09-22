'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { Sparkles } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { generateBillsAction } from '@/lib/actions/admin-billing';

export function GenerateBillsButton({
  period,
  inline = false,
}: {
  period?: string;
  inline?: boolean;
}) {
  const [state, formAction] = useFormState(
    generateBillsAction,
    {} as { error?: string; success?: string },
  );
  const { toast } = useToast();
  const shown = React.useRef<string | undefined>();

  React.useEffect(() => {
    if (state.success && shown.current !== state.success) {
      shown.current = state.success;
      toast({ tone: 'success', title: 'Tagihan diproses', description: state.success });
    }
  }, [state.success, toast]);

  return (
    <form action={formAction} className={inline ? 'space-y-3' : undefined}>
      {period ? <input type="hidden" name="period" value={period} /> : null}
      <SubmitButton variant={inline ? 'primary' : 'outline'} className={inline ? 'w-full' : ''}>
        <Sparkles aria-hidden />
        Generate Tagihan Bulan Ini
      </SubmitButton>
      {inline && state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {inline && state.success ? <Alert tone="success">{state.success}</Alert> : null}
    </form>
  );
}
