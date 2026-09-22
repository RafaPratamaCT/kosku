'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { Megaphone } from 'lucide-react';

import { Alert } from '@/components/ui/misc';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { saveAnnouncementAction } from '@/lib/actions/admin-misc';

export function AnnouncementForm({
  values,
}: {
  values?: { id: string; title: string; content: string; isPinned: boolean };
}) {
  const [state, formAction] = useFormState(
    saveAnnouncementAction,
    {} as { error?: string; success?: string },
  );
  const ref = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.success && !values) ref.current?.reset();
  }, [state.success, values]);

  return (
    <form ref={ref} action={formAction} className="space-y-5">
      {values ? <input type="hidden" name="announcementId" value={values.id} /> : null}

      <Field label="Judul" required htmlFor={`title-${values?.id ?? 'new'}`}>
        <Input
          id={`title-${values?.id ?? 'new'}`}
          name="title"
          required
          minLength={3}
          maxLength={120}
          placeholder="Contoh: Kerja bakti hari Minggu"
          defaultValue={values?.title}
        />
      </Field>

      <Field label="Isi pengumuman" required htmlFor={`content-${values?.id ?? 'new'}`}>
        <Textarea
          id={`content-${values?.id ?? 'new'}`}
          name="content"
          required
          minLength={10}
          rows={5}
          placeholder="Tulis informasi lengkapnya di sini..."
          defaultValue={values?.content}
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5">
        <Checkbox name="isPinned" defaultChecked={values?.isPinned} />
        <span className="text-[13px] text-ink">Sematkan di paling atas</span>
      </label>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <SubmitButton>
        <Megaphone aria-hidden />
        {values ? 'Simpan perubahan' : 'Terbitkan pengumuman'}
      </SubmitButton>
    </form>
  );
}
