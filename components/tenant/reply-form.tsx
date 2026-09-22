'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-dom';
import { Send } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { replyComplaintAction } from '@/lib/actions/complaints';

export function ReplyForm({
  complaintId,
  placeholder = 'Tulis balasan...',
}: {
  complaintId: string;
  placeholder?: string;
}) {
  const [state, formAction] = useFormState(
    replyComplaintAction,
    {} as { error?: string; success?: string },
  );
  const ref = React.useRef<HTMLFormElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <input type="hidden" name="complaintId" value={complaintId} />
      <Textarea
        name="message"
        required
        rows={3}
        placeholder={placeholder}
        className="min-h-[88px]"
        aria-label="Isi balasan"
      />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      <div className="flex justify-end">
        <SubmitButton size="sm">
          <Send aria-hidden />
          Kirim balasan
        </SubmitButton>
      </div>
    </form>
  );
}
