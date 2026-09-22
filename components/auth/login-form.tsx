'use client';

import { useFormState } from 'react-dom';

import { Alert } from '@/components/ui/misc';
import { Field, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { loginAction } from '@/lib/actions/auth';

export function LoginForm({
  next,
  booking,
}: {
  next?: string;
  booking?: { roomId: string; startDate: string; durationMonths: string };
}) {
  const [state, formAction] = useFormState(loginAction, {} as { error?: string });

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {booking ? (
        <>
          <input type="hidden" name="roomId" value={booking.roomId} />
          <input type="hidden" name="startDate" value={booking.startDate} />
          <input type="hidden" name="durationMonths" value={booking.durationMonths} />
        </>
      ) : null}

      <Field label="Username" required htmlFor="username">
        <Input
          id="username"
          name="username"
          required
          autoComplete="username"
          placeholder="contoh: budi"
          autoFocus
        />
      </Field>

      <Field label="Password" required htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <SubmitButton size="lg" className="w-full">
        Masuk
      </SubmitButton>
    </form>
  );
}
