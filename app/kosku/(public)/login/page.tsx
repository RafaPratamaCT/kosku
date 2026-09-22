import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/misc';

export const metadata: Metadata = { title: 'Masuk' };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const next = first(searchParams.next);
  const roomId = first(searchParams.roomId);
  const startDate = first(searchParams.startDate);
  const durationMonths = first(searchParams.durationMonths);
  const booking =
    roomId && startDate && durationMonths ? { roomId, startDate, durationMonths } : undefined;

  return (
    <div className="container flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-[26px] font-bold leading-tight text-ink sm:text-[30px]">
            Masuk ke akun Anda
          </h1>
          <p className="text-[14px] text-ink-muted">
            Gunakan username dan password yang dibuat saat mendaftar.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {booking ? (
            <Alert tone="info" className="mb-5">
              Setelah masuk, booking kamar Anda langsung dilanjutkan ke pembayaran.
            </Alert>
          ) : null}
          <LoginForm next={next} booking={booking} />
        </Card>

        <p className="text-center text-[13.5px] text-ink-muted">
          Belum punya akun?{' '}
          <Link href="/kosku/register" className="font-semibold text-brand hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
