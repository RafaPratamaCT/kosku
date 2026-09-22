import Link from 'next/link';
import type { BillStatus, Prisma } from '@prisma/client';
import { ArrowRight, Receipt } from 'lucide-react';

import { GenerateBillsButton } from '@/components/admin/generate-bills-button';
import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { SearchInput } from '@/components/dashboard/search-input';
import { Card } from '@/components/ui/card';
import { EmptyState, Pagination, PageHeader } from '@/components/ui/misc';
import { BillStatusBadge } from '@/components/ui/status';
import { Table, TableScroll, TableWrap, Td, Th, Tr } from '@/components/ui/table';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPeriod, formatRupiah } from '@/lib/format';
import { clampPage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Semua tagihan' };

const PAGE_SIZE = 15;

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'UNPAID', label: 'Belum bayar' },
  { value: 'OVERDUE', label: 'Telat' },
  { value: 'WAITING_VERIFICATION', label: 'Perlu verifikasi' },
  { value: 'PAID', label: 'Lunas' },
];

export default async function AdminBillsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  await requireAdmin();

  const where: Prisma.BillWhereInput = {};
  if (searchParams.status && TABS.some((tab) => tab.value === searchParams.status && tab.value)) {
    where.status = searchParams.status as BillStatus;
  }
  if (searchParams.q) {
    where.OR = [
      { tenancy: { user: { fullName: { contains: searchParams.q, mode: 'insensitive' } } } },
      { tenancy: { room: { number: { contains: searchParams.q, mode: 'insensitive' } } } },
      { period: { contains: searchParams.q } },
    ];
  }

  const total = await prisma.bill.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = clampPage(searchParams.page, totalPages);

  const [bills, counts, arrears, waiting] = await Promise.all([
    prisma.bill.findMany({
      where,
      orderBy: [{ dueDate: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        tenancy: {
          select: {
            room: { select: { number: true } },
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    }),
    prisma.bill.groupBy({ by: ['status'], _count: true }),
    prisma.bill.aggregate({
      where: { status: { in: ['UNPAID', 'OVERDUE'] } },
      _sum: { totalAmount: true },
    }),
    prisma.bill.count({ where: { status: 'WAITING_VERIFICATION' } }),
  ]);

  const tabs = TABS.map((tab) => ({
    ...tab,
    count: tab.value
      ? (counts.find((item) => item.status === tab.value)?._count ?? 0)
      : counts.reduce((sum, item) => sum + item._count, 0),
  }));

  const baseQuery = new URLSearchParams();
  if (searchParams.status) baseQuery.set('status', searchParams.status);
  if (searchParams.q) baseQuery.set('q', searchParams.q);
  const baseUrl = `/kosku/admin/bills${baseQuery.toString() ? `?${baseQuery}` : ''}`;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Semua tagihan"
        description="Terbitkan tagihan bulanan, catat pembayaran tunai, dan verifikasi bukti transfer."
        action={<GenerateBillsButton />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-ink-muted">Total tunggakan</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-danger">
            {formatRupiah(arrears._sum.totalAmount ?? 0)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-ink-muted">Perlu verifikasi</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-ink">{waiting}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-ink-muted">Total tagihan</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-ink">{total}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterTabs tabs={tabs} paramName="status" basePath="/kosku/admin/bills" />
        <SearchInput placeholder="Cari nama, kamar, periode..." className="sm:w-72" />
      </div>

      {bills.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt aria-hidden />}
            title="Tidak ada tagihan"
            description="Coba ubah filter, atau terbitkan tagihan bulan ini lewat tombol di atas."
          />
        </Card>
      ) : (
        <TableWrap>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Penghuni</Th>
                  <Th>Kamar</Th>
                  <Th>Periode</Th>
                  <Th>Jatuh tempo</Th>
                  <Th className="text-right">Jumlah</Th>
                  <Th>Status</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <Tr key={bill.id}>
                    <Td>
                      <Link
                        href={`/kosku/admin/tenants/${bill.tenancy.user.id}`}
                        className="text-[13.5px] font-semibold text-ink hover:underline"
                      >
                        {bill.tenancy.user.fullName}
                      </Link>
                    </Td>
                    <Td className="text-ink-muted">{bill.tenancy.room.number}</Td>
                    <Td className="font-medium text-ink">{formatPeriod(bill.period)}</Td>
                    <Td className="whitespace-nowrap text-ink-muted">{formatDate(bill.dueDate)}</Td>
                    <Td className="whitespace-nowrap text-right font-semibold text-ink">
                      {formatRupiah(bill.totalAmount)}
                    </Td>
                    <Td>
                      <BillStatusBadge status={bill.status} />
                    </Td>
                    <Td>
                      <Link
                        href={`/kosku/admin/bills/${bill.id}`}
                        className="inline-flex size-8 items-center justify-center rounded-xs text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
                        aria-label="Buka detail tagihan"
                      >
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
          <Pagination page={page} totalPages={totalPages} baseUrl={baseUrl} />
        </TableWrap>
      )}
    </div>
  );
}
