'use client';

import * as React from 'react';
import { Banknote, QrCode } from 'lucide-react';

import { QrisPanel } from '@/components/payment/qris-panel';
import { TransferProofForm } from '@/components/tenant/transfer-proof-form';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PayOptions({
  billId,
  charge,
  bank,
}: {
  billId: string;
  charge: { qrImageDataUrl: string; reference: string; amount: number; expiresAt: string };
  bank: { name: string; number: string; holder: string };
}) {
  const [tab, setTab] = React.useState<'qris' | 'transfer'>('qris');

  const tabs = [
    { key: 'qris' as const, label: 'QRIS', icon: QrCode },
    { key: 'transfer' as const, label: 'Transfer bank', icon: Banknote },
  ];

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1.5 rounded-md bg-surface-muted p-1"
        role="tablist"
        aria-label="Pilih metode pembayaran"
      >
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
              tab === item.key ? 'bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink',
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'qris' ? (
        <QrisPanel
          qrImageDataUrl={charge.qrImageDataUrl}
          reference={charge.reference}
          amount={charge.amount}
          expiresAt={charge.expiresAt}
          title="Bayar tagihan dengan QRIS"
          description="Pindai QR ini, lalu tekan tombol simulasi di bawah."
        />
      ) : (
        <Card className="p-6">
          <TransferProofForm billId={billId} bank={bank} />
        </Card>
      )}
    </div>
  );
}
