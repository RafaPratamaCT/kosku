import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';

import { AddBillItemForm, RecordCashForm, VerifyPaymentForm } from '@/components/admin/bill-tools';
import { Button } from '@/components/ui/button';
import { ExternalButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/misc';
import { BillStatusBadge, BILL_ITEM_TYPE_LABEL, PaymentStatusBadge } from '@/components/ui/status';
import { removeBillItemAction } from '@/lib/actions/admin-billing';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatDateTime, formatPeriod, formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Detail tagihan' };

const METHOD_LABEL: Record<string, string> = {
  QRIS_DEMO: 'QRIS (demo)',
  TRANSFER: 'Transfer bank',
  CASH: 'Tunai',
};

export default async function AdminBillDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const bill = await prisma.bill.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: { amount: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' } },
      tenancy: {
        include: {
          room: { select: { number: true } },
          user: { select: { id: true, fullName: true, phone: true } },
        },
      },
    },
  });

  if (!bill) notFound();

  const pendingProof = bill.payments.find(
    (payment) => payment.status === 'PENDING' && payment.method === 'TRANSFER',
  );
  const editable = bill.status !== 'PAID';

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link
          href="/kosku/admin/bills"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar tagihan
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-bold leading-tight text-ink">
                Tagihan {formatPeriod(bill.period)}
              </h1>
              <BillStatusBadge status={bill.status} />
            </div>
            <p className="text-[13.5px] text-ink-muted">
              <Link
                href={`/kosku/admin/tenants/${bill.tenancy.user.id}`}
                className="font-medium text-ink hover:underline"
              >
                {bill.tenancy.user.fullName}
              </Link>{' '}
              · Kamar {bill.tenancy.room.number} · Jatuh tempo {formatDate(bill.dueDate)}
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
            Unduh invoice
          </ExternalButtonLink>
        </div>
      </div>

      {pendingProof ? (
        <Alert tone="info" title="Ada bukti transfer menunggu verifikasi">
          Periksa bukti di bawah, lalu setujui atau tolak.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Rincian tagihan</h2>
            </div>
            <ul className="divide-y divide-line">
              {bill.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{item.label}</p>
                    <p className="text-[11.5px] text-ink-muted">
                      {BILL_ITEM_TYPE_LABEL[item.type]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {formatRupiah(item.amount)}
                    </p>
                    {editable && bill.items.length > 1 ? (
                      <form action={removeBillItemAction}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          aria-label={`Hapus ${item.label}`}
                          className="flex size-7 items-center justify-center rounded-xs text-ink-subtle transition hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </form>
                    ) : null}
                  </div>
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
              <h2 className="text-[15px] font-semibold text-ink">Pembayaran</h2>
            </div>
            {bill.payments.length === 0 ? (
              <p className="px-6 py-8 text-center text-[13px] text-ink-muted">
                Belum ada pembayaran untuk tagihan ini.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {bill.payments.map((payment) => (
                  <li key={payment.id} className="space-y-3 px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[14px] font-semibold text-ink">
                        {formatRupiah(payment.amount)}
                      </p>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                    <p className="text-[12px] text-ink-muted">
                      {METHOD_LABEL[payment.method] ?? payment.method} ·{' '}
                      {formatDateTime(payment.paidAt ?? payment.createdAt)}
                      {payment.qrisRef ? ` · Ref ${payment.qrisRef}` : ''}
                    </p>
                    {payment.note ? (
                      <p className="text-[12.5px] text-ink-muted">{payment.note}</p>
                    ) : null}
                    {payment.proofUrl ? (
                      <a href={payment.proofUrl} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={payment.proofUrl}
                          alt="Bukti transfer"
                          className="max-h-64 rounded-md border border-line object-contain transition hover:opacity-90"
                        />
                      </a>
                    ) : null}
                    {payment.status === 'PENDING' ? (
                      <div className="rounded-md bg-surface-muted/60 p-4">
                        <VerifyPaymentForm paymentId={payment.id} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {editable ? (
            <>
              <Card className="space-y-5 p-6">
                <div className="space-y-1">
                  <h2 className="text-[15px] font-semibold text-ink">Catat pembayaran</h2>
                  <p className="text-[12.5px] leading-relaxed text-ink-muted">
                    Untuk pembayaran tunai yang diterima langsung.
                  </p>
                </div>
                <RecordCashForm billId={bill.id} amount={bill.totalAmount} />
              </Card>

              <Card className="space-y-5 p-6">
                <div className="space-y-1">
                  <h2 className="text-[15px] font-semibold text-ink">Tambah biaya</h2>
                  <p className="text-[12.5px] leading-relaxed text-ink-muted">
                    Listrik berlebih, air, layanan, atau denda. Total tagihan dihitung ulang
                    otomatis.
                  </p>
                </div>
                <AddBillItemForm billId={bill.id} />
              </Card>
            </>
          ) : (
            <Card className="space-y-3 p-6 text-center">
              <p className="text-[15px] font-semibold text-ink">Tagihan sudah lunas</p>
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Dibayar pada {bill.paidAt ? formatDate(bill.paidAt) : '—'}. Rincian tagihan yang
                sudah lunas tidak bisa diubah lagi.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
