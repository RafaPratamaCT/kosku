'use client';

import { useFormState } from 'react-dom';

import { Alert } from '@/components/ui/misc';
import { Field, FileInput, Input, Select, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { createComplaintAction } from '@/lib/actions/complaints';

const CATEGORIES = ['Listrik', 'Air', 'AC', 'WiFi', 'Kebersihan', 'Keamanan', 'Lainnya'];

export function ComplaintForm() {
  const [state, formAction] = useFormState(createComplaintAction, {} as { error?: string });

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kategori" required htmlFor="category">
          <Select id="category" name="category" required defaultValue="Listrik">
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Tingkat prioritas"
          required
          htmlFor="priority"
          hint="Pilih Tinggi kalau mengganggu aktivitas harian."
        >
          <Select id="priority" name="priority" required defaultValue="MEDIUM">
            <option value="LOW">Rendah</option>
            <option value="MEDIUM">Sedang</option>
            <option value="HIGH">Tinggi</option>
          </Select>
        </Field>
      </div>

      <Field label="Judul komplain" required htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={120}
          placeholder="Contoh: Keran kamar mandi bocor"
        />
      </Field>

      <Field
        label="Deskripsi"
        required
        htmlFor="description"
        hint="Jelaskan sedetail mungkin: sejak kapan, bagian mana, sudah dicoba apa."
      >
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={6}
          placeholder="Ceritakan masalahnya di sini..."
        />
      </Field>

      <Field
        label="Foto pendukung"
        htmlFor="photos"
        hint="Boleh lebih dari satu, maksimal 4 foto dan 5 MB per foto."
      >
        <FileInput id="photos" name="photos" accept="image/*" multiple />
      </Field>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <SubmitButton size="lg" className="w-full sm:w-auto">
        Kirim komplain
      </SubmitButton>
    </form>
  );
}
