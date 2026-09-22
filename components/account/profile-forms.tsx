'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Alert } from '@/components/ui/misc';
import { Field, FileInput, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { changePasswordAction, updateProfileAction } from '@/lib/actions/auth';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations';

type ProfileValues = {
  fullName: string;
  phone: string;
  email: string;
  occupation: string;
  emergencyName: string;
  emergencyPhone: string;
};

export function ProfileForm({ values }: { values: ProfileValues }) {
  const [state, formAction] = useFormState(
    updateProfileAction,
    {} as { error?: string; success?: string },
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama lengkap" required htmlFor="fullName">
          <Input id="fullName" name="fullName" required defaultValue={values.fullName} />
        </Field>
        <Field label="Nomor HP" required htmlFor="phone">
          <Input id="phone" name="phone" required defaultValue={values.phone} inputMode="tel" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={values.email} />
        </Field>
        <Field label="Pekerjaan / status" htmlFor="occupation">
          <Input id="occupation" name="occupation" defaultValue={values.occupation} />
        </Field>
      </div>

      <div className="space-y-5 border-t border-line pt-6">
        <p className="text-[14px] font-semibold text-ink">Kontak darurat</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama kontak darurat" htmlFor="emergencyName">
            <Input id="emergencyName" name="emergencyName" defaultValue={values.emergencyName} />
          </Field>
          <Field label="Nomor kontak darurat" htmlFor="emergencyPhone">
            <Input
              id="emergencyPhone"
              name="emergencyPhone"
              defaultValue={values.emergencyPhone}
              inputMode="tel"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-5 border-t border-line pt-6">
        <Field
          label="Perbarui foto KTP"
          htmlFor="idCard"
          hint="Kosongkan kalau tidak ingin mengganti."
        >
          <FileInput id="idCard" name="idCard" accept="image/*" />
        </Field>
      </div>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <SubmitButton>Simpan perubahan</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useFormState(
    changePasswordAction,
    {} as { error?: string; success?: string },
  );
  const {
    register,
    trigger,
    reset,
    formState: { errors, isValid },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (state.success) reset();
  }, [state.success, reset]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isValid) {
      event.preventDefault();
      void trigger();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field
        label="Password lama"
        required
        htmlFor="currentPassword"
        error={errors.currentPassword?.message}
      >
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register('currentPassword')}
        />
      </Field>
      <Field
        label="Password baru"
        required
        htmlFor="newPassword"
        hint="Minimal 6 karakter."
        error={errors.newPassword?.message}
      >
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register('newPassword')}
        />
      </Field>
      <Field
        label="Ulangi password baru"
        required
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
      </Field>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <SubmitButton variant="outline">Ganti password</SubmitButton>
    </form>
  );
}
