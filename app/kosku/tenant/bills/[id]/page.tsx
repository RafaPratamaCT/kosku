import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';

import { PayOptions } from '@/components/tenant/pay-options';
import { Button } from '@/components/ui/button';
import { ExternalButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/misc';
import { BillStatusBadge, BILL_ITEM_TYPE_LABEL, PaymentStatusBadge } from '@/components/ui/status';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatDateTime, formatPeriod, formatRupiah } from '@/lib/format';
import { ensureBillCharge } from '@/lib/payment/charges';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Detail tagihan' };

const METHOD_LABEL: Record<string, string> = {
  QRIS_DEMO: 'QRIS (demo)',
  TRANSFER: 'Transfer bank',
  CASH: 'Tunai',
};

export default async function TenantBillDetailPage({ params }: { params: { id: string } }) {
  const user = await requireTenant();

  const bill = await prisma.bill.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: { amount: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' } },
      tenancy: { include: { room: { select: { number: true } }, user: { select: { id: true } } } },
    },
  });

  if (!bill) notFound();
  // Penghuni hanya boleh membuka tagihan miliknya sendiri.
  if (bill.tenancy.userId !== user.id) notFound();

  const settings = await getSettings();
  const payable = bill.status === 'UNPAID' || bill.status === 'OVERDUE';
  const charge = payable ? await ensureBillCharge(bill) : null;

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link
          href="/kosku/tenant/bills"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar tagihan
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-bold leading-tight text-ink">
                Tagihan {formatPeriod(bill.period)}
              </h1>
              <BillStatusBadge status={bill.status} />
            </div>
            <p className="text-[13.5px] text-ink-muted">
              Kamar {bill.tenancy.room.number} · Jatuh tempo {formatDate(bill.dueDate)}
            </p>
          </div>

          <ExternalButtonLink
            href={`/api/documents/invoice/${bill.id}`}
            variant="outline"
            className="shrink-0"
            target="_blank"
            rel="noreferrer"
          >
            <Download aria-hidden />
            Unduh invoice PDF
          </ExternalButtonLink>
        </div>
      </div>

      {bill.status === 'WAITING_VERIFICATION' ? (
        <Alert tone="info" title="Bukti transfer sedang diperiksa">
          Pemilik kos akan memverifikasi pembayaran Anda. Status berubah otomatis begitu disetujui.
        </Alert>
      ) : null}

      {bill.status === 'OVERDUE' ? (
        <Alert tone="danger" title="Tagihan lewat jatuh tempo">
          Denda keterlambatan sebesar {formatRupiah(bill.lateFee)} sudah ditambahkan ke tagihan ini.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Rincian tagihan</h2>
            </div>
            <ul className="divide-y divide-line">
              {bill.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{item.label}</p>
                    <p className="text-[11.5px] text-ink-muted">
                      {BILL_ITEM_TYPE_LABEL[item.type]}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13.5px] font-semibold text-ink">
                    {formatRupiah(item.amount)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex items-end justify-between border-t border-line bg-surface-muted/40 px-6 py-5">
              <span className="text-[13.5px] font-medium text-ink">Total</span>
              <span className="text-[22px] font-bold text-ink">
                {formatRupiah(bill.totalAmount)}
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Riwayat pembayaran</h2>
            </div>
            {bill.payments.length === 0 ? (
              <p className="px-6 py-8 text-center text-[13px] text-ink-muted">
                Belum ada pembayaran untuk tagihan ini.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {bill.payments.map((payment) => (
                  <li key={payment.id} className="space-y-2 px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13.5px] font-semibold text-ink">
                        {formatRupiah(payment.amount)}
                      </p>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
                      <span>{METHOD_LABEL[payment.method] ?? payment.method}</span>
                      <span aria-hidden>·</span>
                      <span>{formatDateTime(payment.paidAt ?? payment.createdAt)}</span>
                      {payment.status === 'VERIFIED' ? (
                        <>
                          <span aria-hidden>·</span>
                          <a
                            href={`/api/documents/receipt/${payment.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                          >
                            <FileText className="size-3.5" aria-hidden />
                            Kwitansi
                          </a>
                        </>
                      ) : null}
                    </div>
                    {payment.note ? (
                      <p className="text-[12px] text-ink-muted">{payment.note}</p>
                    ) : null}
                    {payment.proofUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={payment.proofUrl}
                        alt="Bukti transfer"
                        className="mt-2 max-h-48 rounded-md border border-line object-contain"
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:sticky lg:top-24">
          {payable && charge ? (
            <PayOptions
              billId={bill.id}
              charge={{
                qrImageDataUrl: charge.qrImageDataUrl,
                reference: charge.reference,
                amount: charge.amount,
                expiresAt: charge.expiresAt.toISOString(),
              }}
              bank={{
                name: settings.bankName,
                number: settings.bankAccountNumber,
                holder: settings.bankAccountName,
              }}
            />
          ) : (
            <Card className="space-y-4 p-6 text-center">
              <p className="text-[15px] font-semibold text-ink">
                {bill.status === 'PAID' ? 'Tagihan ini sudah lunas' : 'Menunggu verifikasi'}
              </p>
              <p className="text-[13px] leading-relaxed text-ink-muted">
                {bill.status === 'PAID'
                  ? `Dibayar pada ${bill.paidAt ? formatDate(bill.paidAt) : '—'}. Kwitansi bisa diunduh dari riwayat pembayaran.`
                  : 'Bukti transfer Anda sedang diperiksa pemilik kos.'}
              </p>
              <ExternalButtonLink
                href={`/api/documents/invoice/${bill.id}`}
                variant="outline"
                className="w-full"
                target="_blank"
                rel="noreferrer"
              >
                <Download aria-hidden />
                Unduh invoice
              </ExternalButtonLink>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
