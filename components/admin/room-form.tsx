'use client';

import { useFormState } from 'react-dom';

import { Alert } from '@/components/ui/misc';
import { Field, FileInput, Input, Select, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { createRoomAction, updateRoomAction } from '@/lib/actions/admin-rooms';

export type RoomFormValues = {
  id?: string;
  number: string;
  type: string;
  floor: number;
  price: number;
  size: string;
  description: string;
  facilities: string[];
};

export function RoomForm({ values }: { values?: RoomFormValues }) {
  const editing = Boolean(values?.id);
  const [state, formAction] = useFormState(
    editing ? updateRoomAction : createRoomAction,
    {} as { error?: string; success?: string },
  );

  return (
    <form action={formAction} className="space-y-6">
      {values?.id ? <input type="hidden" name="roomId" value={values.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nomor kamar" required htmlFor="number">
          <Input
            id="number"
            name="number"
            required
            maxLength={12}
            placeholder="A1"
            defaultValue={values?.number}
          />
        </Field>

        <Field label="Tipe kamar" required htmlFor="type">
          <Select id="type" name="type" required defaultValue={values?.type ?? 'STANDARD'}>
            <option value="STANDARD">Standard</option>
            <option value="DELUXE">Deluxe</option>
            <option value="VIP">VIP</option>
          </Select>
        </Field>

        <Field label="Lantai" required htmlFor="floor">
          <Input
            id="floor"
            name="floor"
            type="number"
            min={1}
            max={20}
            required
            defaultValue={values?.floor ?? 1}
          />
        </Field>

        <Field label="Harga per bulan (Rp)" required htmlFor="price">
          <Input
            id="price"
            name="price"
            type="number"
            min={1000}
            step={50000}
            required
            placeholder="850000"
            defaultValue={values?.price}
          />
        </Field>

        <Field label="Ukuran kamar" required htmlFor="size" hint="Contoh: 3 x 4 m">
          <Input id="size" name="size" required placeholder="3 x 4 m" defaultValue={values?.size} />
        </Field>

        {!editing ? (
          <Field label="Status awal" htmlFor="status">
            <Select id="status" name="status" defaultValue="AVAILABLE">
              <option value="AVAILABLE">Tersedia</option>
              <option value="LOCKED">Terkunci</option>
              <option value="MAINTENANCE">Perbaikan</option>
            </Select>
          </Field>
        ) : null}
      </div>

      <Field
        label="Deskripsi"
        htmlFor="description"
        hint="Ceritakan kelebihan kamar ini — dilihat calon penghuni di halaman publik."
      >
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Kamar terang menghadap taman, dekat dapur bersama..."
          defaultValue={values?.description}
        />
      </Field>

      <Field
        label="Fasilitas"
        htmlFor="facilities"
        hint="Pisahkan dengan koma atau baris baru. Contoh: AC, Kasur, Lemari, WiFi"
      >
        <Textarea
          id="facilities"
          name="facilities"
          rows={3}
          placeholder="AC, Kasur & lemari, Meja belajar, WiFi"
          defaultValue={values?.facilities.join(', ')}
        />
      </Field>

      <Field
        label={editing ? 'Tambah foto kamar' : 'Foto kamar'}
        htmlFor="photos"
        hint="Boleh beberapa sekaligus, maksimal 6 foto dan 5 MB per foto."
      >
        <FileInput id="photos" name="photos" accept="image/*" multiple />
      </Field>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <SubmitButton size="lg" className="w-full sm:w-auto">
        {editing ? 'Simpan perubahan' : 'Tambah kamar'}
      </SubmitButton>
    </form>
  );
}
