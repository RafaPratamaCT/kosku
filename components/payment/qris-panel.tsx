'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { formatRupiah } from '@/lib/format';

/**
 * Hitung mundur dimulai setelah komponen terpasang di browser, supaya
 * hasil render di server dan di klien tidak berbeda.
 */
function useCountdown(target: string) {
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, new Date(target).getTime() - Date.now()));
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (remaining === null) {
    return { ready: false, expired: false, label: '--:--' };
  }

  const totalSeconds = Math.floor(remaining / 1000);
  return {
    ready: true,
    expired: remaining <= 0,
    label: `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(
      totalSeconds % 60,
    ).padStart(2, '0')}`,
  };
}

export function QrisPanel({
  qrImageDataUrl,
  reference,
  amount,
  expiresAt,
  title = 'Bayar dengan QRIS',
  description = 'Pindai QR ini dengan aplikasi pembayaran Anda.',
  onExpiredHref,
}: {
  qrImageDataUrl: string;
  reference: string;
  amount: number;
  expiresAt: string;
  title?: string;
  description?: string;
  onExpiredHref?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { ready, expired, label } = useCountdown(expiresAt);

  async function simulate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/qris/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrisRef: reference, status: 'PAID', amount }),
      });
      const data: { ok: boolean; message?: string; redirect?: string } = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message ?? 'Pembayaran gagal diproses.');
        toast({ tone: 'error', title: 'Pembayaran gagal', description: data.message });
        return;
      }

      toast({
        tone: 'success',
        title: 'Pembayaran berhasil',
        description: 'Status Anda sudah diperbarui.',
      });
      router.replace(data.redirect ?? '/kosku/tenant');
      router.refresh();
    } catch {
      setError('Tidak bisa menghubungi server. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Alert tone="warn" title="MODE DEMO — tidak ada transaksi uang sungguhan">
        QR di bawah dibuat dari data contoh dengan merchant KOSKU-DEMO. Memindainya tidak akan
        memotong saldo Anda.
      </Alert>

      <div className="overflow-hidden rounded-2xl bg-surface shadow-soft">
        <div className="space-y-1.5 border-b border-line px-6 py-5 text-center">
          <p className="text-[15px] font-semibold text-ink">{title}</p>
          <p className="text-[13px] text-ink-muted">{description}</p>
        </div>

        <div className="flex flex-col items-center gap-5 px-6 py-8">
          <div className="rounded-xl bg-white p-3 shadow-xs ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageDataUrl}
              alt="Kode QR pembayaran demo"
              className="size-52 sm:size-60"
            />
          </div>

          <div className="space-y-1 text-center">
            <p className="text-[12.5px] text-ink-muted">Total pembayaran</p>
            <p className="text-[28px] font-bold leading-none text-ink">{formatRupiah(amount)}</p>
          </div>

          <div
            className={
              expired
                ? 'inline-flex items-center gap-2 rounded-full bg-danger-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-danger'
                : 'inline-flex items-center gap-2 rounded-full bg-surface-muted px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-muted'
            }
          >
            <Clock className="size-3.5" aria-hidden />
            {!ready ? 'Menyiapkan…' : expired ? 'Waktu pembayaran habis' : `Berlaku ${label} lagi`}
          </div>

          <p className="break-all text-center text-[11.5px] text-ink-subtle">Ref: {reference}</p>
        </div>

        <div className="space-y-3 border-t border-line bg-surface-muted/40 px-6 py-5">
          {error ? <Alert tone="danger">{error}</Alert> : null}

          {expired ? (
            <div className="space-y-3">
              <Alert tone="danger" title="Sesi pembayaran berakhir">
                Kamar sudah dilepas kembali. Silakan pesan ulang.
              </Alert>
              {onExpiredHref ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(onExpiredHref)}
                >
                  Pilih kamar lagi
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <Button size="lg" className="w-full" loading={loading} onClick={simulate}>
                <Wallet aria-hidden />
                Simulasikan Pembayaran Berhasil
              </Button>
              <p className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-subtle">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Tombol ini memanggil endpoint webhook yang sama dengan gateway asli (POST
                /api/payments/qris/callback), jadi alur kodenya tidak berubah saat nanti diganti ke
                pembayaran sungguhan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
