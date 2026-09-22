import Link from 'next/link';
import type { BillStatus, Prisma } from '@prisma/client';
import { ArrowRight, Receipt } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Table, TableScroll, TableWrap, Td, Th, Tr } from '@/components/ui/table';
import { BillStatusBadge } from '@/components/ui/status';
import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { requireTenant } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPeriod, formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Tagihan saya' };

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'UNPAID', label: 'Belum bayar' },
  { value: 'OVERDUE', label: 'Telat' },
  { value: 'WAITING_VERIFICATION', label: 'Menunggu verifikasi' },
  { value: 'PAID', label: 'Lunas' },
];

export default async function TenantBillsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireTenant();
  const status = searchParams.status;

  const where: Prisma.BillWhereInput = { tenancy: { userId: user.id } };
  if (status && TABS.some((tab) => tab.value === status && tab.value)) {
    where.status = status as BillStatus;
  }

  const [bills, summary] = await Promise.all([
    prisma.bill.findMany({
      where,
      orderBy: [{ dueDate: 'desc' }],
      include: { tenancy: { select: { room: { select: { number: true } } } } },
    }),
    prisma.bill.aggregate({
      where: { tenancy: { userId: user.id }, status: { in: ['UNPAID', 'OVERDUE'] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  const outstanding = summary._sum.totalAmount ?? 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Tagihan saya"
        description="Semua tagihan sewa dan biaya tambahan tercatat di sini."
      />

      {outstanding > 0 ? (
        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12.5px] font-medium text-ink-muted">Total yang harus dibayar</p>
            <p className="mt-1 text-[26px] font-bold leading-none text-ink">
              {formatRupiah(outstanding)}
            </p>
            <p className="mt-1.5 text-[12.5px] text-ink-muted">
              dari {summary._count} tagihan belum lunas
            </p>
          </div>
        </Card>
      ) : null}

      <StatusFilterTabs tabs={TABS} paramName="status" basePath="/kosku/tenant/bills" />

      {bills.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt aria-hidden />}
            title="Belum ada tagihan"
            description="Tagihan akan muncul di sini begitu diterbitkan oleh pemilik kos."
          />
        </Card>
      ) : (
        <TableWrap>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Periode</Th>
                  <Th>Kamar</Th>
                  <Th>Jatuh tempo</Th>
                  <Th className="text-right">Jumlah</Th>
                  <Th>Status</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <Tr key={bill.id}>
                    <Td className="font-semibold text-ink">{formatPeriod(bill.period)}</Td>
                    <Td className="text-ink-muted">{bill.tenancy.room.number}</Td>
                    <Td className="text-ink-muted">{formatDate(bill.dueDate)}</Td>
                    <Td className="text-right font-semibold text-ink">
                      {formatRupiah(bill.totalAmount)}
                    </Td>
                    <Td>
                      <BillStatusBadge status={bill.status} />
                    </Td>
                    <Td>
                      <Link
                        href={`/kosku/tenant/bills/${bill.id}`}
                        className="inline-flex size-8 items-center justify-center rounded-xs text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
                        aria-label={`Lihat detail tagihan ${formatPeriod(bill.period)}`}
                      >
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
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
