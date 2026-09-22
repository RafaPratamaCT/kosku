'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Alert } from '@/components/ui/misc';
import { Field, FileInput, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { registerAction } from '@/lib/actions/auth';
import { registerSchema, type RegisterInput } from '@/lib/validations';

/**
 * Form dikirim langsung ke server action, jadi tetap jalan walau JavaScript
 * mati. React Hook Form dipakai untuk menampilkan pesan kesalahan tiap kolom
 * secara langsung, memakai skema Zod yang sama dengan pemeriksaan di server.
 */
export function RegisterForm({
  next,
  booking,
}: {
  next?: string;
  booking?: { roomId: string; startDate: string; durationMonths: string };
}) {
  const [state, formAction] = useFormState(registerAction, {} as { error?: string });
  const {
    register,
    trigger,
    formState: { errors, isValid },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  // Dicegah secara sinkron supaya form yang belum valid tidak pernah
  // terkirim ke server; pesan kesalahannya dimunculkan sesudahnya.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isValid) {
      event.preventDefault();
      void trigger();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-8">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {booking ? (
        <>
          <input type="hidden" name="roomId" value={booking.roomId} />
          <input type="hidden" name="startDate" value={booking.startDate} />
          <input type="hidden" name="durationMonths" value={booking.durationMonths} />
        </>
      ) : null}

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-[15px] font-semibold text-ink">Akun masuk</h2>
          <p className="text-[13px] text-ink-muted">
            Username dan password ini yang Anda pakai untuk masuk seterusnya.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Username"
            required
            htmlFor="username"
            hint="Huruf kecil, angka, dan garis bawah."
            error={errors.username?.message}
          >
            <Input
              id="username"
              autoComplete="username"
              placeholder="contoh: budi_santoso"
              {...register('username')}
            />
          </Field>

          <Field label="Nama lengkap" required htmlFor="fullName" error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Budi Santoso"
              {...register('fullName')}
            />
          </Field>

          <Field
            label="Password"
            required
            htmlFor="password"
            hint="Minimal 6 karakter."
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
            />
          </Field>

          <Field
            label="Ulangi password"
            required
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5 border-t border-line pt-8">
        <div className="space-y-1">
          <h2 className="text-[15px] font-semibold text-ink">Data diri</h2>
          <p className="text-[13px] text-ink-muted">
            Dipakai pemilik kos untuk kontrak sewa dan keperluan administrasi.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nomor HP" required htmlFor="phone" error={errors.phone?.message}>
            <Input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="081234567890"
              {...register('phone')}
            />
          </Field>

          <Field label="Email" htmlFor="email" hint="Opsional." error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              {...register('email')}
            />
          </Field>

          <Field
            label="Pekerjaan / status"
            htmlFor="occupation"
            hint="Opsional."
            error={errors.occupation?.message}
          >
            <Input
              id="occupation"
              placeholder="Mahasiswa, karyawan, dll."
              {...register('occupation')}
            />
          </Field>

          <Field label="Foto KTP" htmlFor="idCard" hint="Gambar JPG/PNG/WEBP, maksimal 5 MB.">
            <FileInput id="idCard" name="idCard" accept="image/*" />
          </Field>
        </div>
      </section>

      <section className="space-y-5 border-t border-line pt-8">
        <div className="space-y-1">
          <h2 className="text-[15px] font-semibold text-ink">Kontak darurat</h2>
          <p className="text-[13px] text-ink-muted">
            Orang yang bisa dihubungi kalau terjadi sesuatu.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Nama kontak darurat"
            required
            htmlFor="emergencyName"
            error={errors.emergencyName?.message}
          >
            <Input
              id="emergencyName"
              placeholder="Nama orang tua / wali"
              {...register('emergencyName')}
            />
          </Field>

          <Field
            label="Nomor kontak darurat"
            required
            htmlFor="emergencyPhone"
            error={errors.emergencyPhone?.message}
          >
            <Input
              id="emergencyPhone"
              inputMode="tel"
              placeholder="081234567890"
              {...register('emergencyPhone')}
            />
          </Field>
        </div>
      </section>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <SubmitButton size="lg" className="w-full">
        {booking ? 'Buat akun & lanjut bayar' : 'Buat akun'}
      </SubmitButton>
    </form>
  );
}
