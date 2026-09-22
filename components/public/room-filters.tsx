'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox, Field, Select } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export type RoomFilterOptions = {
  floors: number[];
  facilities: string[];
  maxPrice: number;
};

export function RoomFilters({ options }: { options: RoomFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const current = React.useMemo(
    () => ({
      type: params.get('type') ?? '',
      floor: params.get('floor') ?? '',
      price: params.get('price') ?? '',
      sort: params.get('sort') ?? 'price-asc',
      status: params.get('status') ?? '',
      facilities: params.getAll('fasilitas'),
    }),
    [params],
  );

  const activeCount =
    (current.type ? 1 : 0) +
    (current.floor ? 1 : 0) +
    (current.price ? 1 : 0) +
    (current.status ? 1 : 0) +
    current.facilities.length;

  function apply(next: Partial<typeof current>) {
    const merged = { ...current, ...next };
    const search = new URLSearchParams();
    if (merged.type) search.set('type', merged.type);
    if (merged.floor) search.set('floor', merged.floor);
    if (merged.price) search.set('price', merged.price);
    if (merged.status) search.set('status', merged.status);
    if (merged.sort && merged.sort !== 'price-asc') search.set('sort', merged.sort);
    for (const facility of merged.facilities) search.append('fasilitas', facility);
    router.push(`${pathname}${search.toString() ? `?${search}` : ''}`, { scroll: false });
  }

  function toggleFacility(facility: string, checked: boolean) {
    const next = checked
      ? [...current.facilities, facility]
      : current.facilities.filter((item) => item !== facility);
    apply({ facilities: next });
  }

  const priceOptions = [
    { value: '', label: 'Semua harga' },
    { value: '0-800000', label: 'Di bawah Rp 800.000' },
    { value: '800000-1200000', label: 'Rp 800.000 – Rp 1,2 jt' },
    { value: '1200000-1800000', label: 'Rp 1,2 jt – Rp 1,8 jt' },
    { value: `1800000-${Math.max(options.maxPrice, 1800000)}`, label: 'Di atas Rp 1,8 jt' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          className="lg:hidden"
        >
          <SlidersHorizontal aria-hidden />
          Filter
          {activeCount > 0 ? (
            <span className="ml-1 rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[12.5px] text-ink-muted sm:inline">Urutkan</span>
          <Select
            value={current.sort}
            onChange={(event) => apply({ sort: event.target.value })}
            className="h-9 w-[190px] text-[13px]"
            aria-label="Urutkan kamar"
          >
            <option value="price-asc">Harga terendah</option>
            <option value="price-desc">Harga tertinggi</option>
            <option value="number-asc">Nomor kamar</option>
            <option value="floor-asc">Lantai terendah</option>
          </Select>
        </div>
      </div>

      <div
        className={cn('rounded-2xl bg-surface p-5 shadow-soft lg:block', open ? 'block' : 'hidden')}
      >
        <div className="grid gap-5 lg:grid-cols-4">
          <Field label="Tipe kamar">
            <Select value={current.type} onChange={(event) => apply({ type: event.target.value })}>
              <option value="">Semua tipe</option>
              <option value="STANDARD">Standard</option>
              <option value="DELUXE">Deluxe</option>
              <option value="VIP">VIP</option>
            </Select>
          </Field>

          <Field label="Harga per bulan">
            <Select
              value={current.price}
              onChange={(event) => apply({ price: event.target.value })}
            >
              {priceOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Lantai">
            <Select
              value={current.floor}
              onChange={(event) => apply({ floor: event.target.value })}
            >
              <option value="">Semua lantai</option>
              {options.floors.map((floor) => (
                <option key={floor} value={String(floor)}>
                  Lantai {floor}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Ketersediaan">
            <Select
              value={current.status}
              onChange={(event) => apply({ status: event.target.value })}
            >
              <option value="">Semua kamar</option>
              <option value="AVAILABLE">Hanya yang tersedia</option>
            </Select>
          </Field>
        </div>

        {options.facilities.length > 0 ? (
          <div className="mt-5 border-t border-line pt-5">
            <p className="mb-3 text-[13px] font-medium text-ink">Fasilitas</p>
            <div className="flex flex-wrap gap-2">
              {options.facilities.map((facility) => {
                const checked = current.facilities.includes(facility);
                return (
                  <label
                    key={facility}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition',
                      checked
                        ? 'border-brand/30 bg-brand-soft text-brand-ink'
                        : 'border-line-strong bg-surface text-ink-muted hover:border-brand/25',
                    )}
                  >
                    <Checkbox
                      className="size-3.5"
                      checked={checked}
                      onChange={(event) => toggleFacility(facility, event.target.checked)}
                    />
                    {facility}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeCount > 0 ? (
          <div className="mt-5 border-t border-line pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(pathname, { scroll: false })}
            >
              <X aria-hidden />
              Hapus semua filter
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
