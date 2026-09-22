import { FileText, Wallet } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Table, TableScroll, TableWrap, Td, Th, Tr } from '@/components/ui/table';
import { PaymentStatusBadge } from '@/components/ui/status';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPeriod, formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Riwayat pembayaran' };

const METHOD_LABEL: Record<string, string> = {
  QRIS_DEMO: 'QRIS (demo)',
  TRANSFER: 'Transfer bank',
  CASH: 'Tunai',
};

export default async function TenantPaymentsPage() {
  const user = await requireTenant();

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { bill: { tenancy: { userId: user.id } } },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      include: { bill: { select: { period: true } } },
    }),
    prisma.payment.aggregate({
      where: { bill: { tenancy: { userId: user.id } }, status: 'VERIFIED' },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Riwayat pembayaran"
        description="Semua pembayaran yang pernah Anda lakukan, lengkap dengan kwitansinya."
      />

      <Card className="p-6">
        <p className="text-[12.5px] font-medium text-ink-muted">Total sudah dibayar</p>
        <p className="mt-1 text-[26px] font-bold leading-none text-ink">
          {formatRupiah(total._sum.amount ?? 0)}
        </p>
        <p className="mt-1.5 text-[12.5px] text-ink-muted">
          dari {payments.filter((payment) => payment.status === 'VERIFIED').length} pembayaran
          terverifikasi
        </p>
      </Card>

      {payments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet aria-hidden />}
            title="Belum ada pembayaran"
            description="Setelah Anda membayar tagihan, riwayatnya akan muncul di sini."
          />
        </Card>
      ) : (
        <TableWrap>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Periode</Th>
                  <Th>Metode</Th>
                  <Th className="text-right">Jumlah</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Kwitansi</Th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <Tr key={payment.id}>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </Td>
                    <Td className="font-medium text-ink">
                      {payment.bill ? formatPeriod(payment.bill.period) : '—'}
                    </Td>
                    <Td className="text-ink-muted">
                      {METHOD_LABEL[payment.method] ?? payment.method}
                    </Td>
                    <Td className="text-right font-semibold text-ink">
                      {formatRupiah(payment.amount)}
                    </Td>
                    <Td>
                      <PaymentStatusBadge status={payment.status} />
                    </Td>
                    <Td className="text-right">
                      {payment.status === 'VERIFIED' ? (
                        <a
                          href={`/api/documents/receipt/${payment.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
                        >
                          <FileText className="size-3.5" aria-hidden />
                          Unduh
                        </a>
                      ) : (
                        <span className="text-[13px] text-ink-subtle">—</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        </TableWrap>
      )}
    </div>
  );
}
