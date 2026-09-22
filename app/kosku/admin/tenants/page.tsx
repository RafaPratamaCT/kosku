import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { ArrowRight, Users } from 'lucide-react';

import { StatusFilterTabs } from '@/components/dashboard/filter-tabs';
import { SearchInput } from '@/components/dashboard/search-input';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { TenancyStatusBadge } from '@/components/ui/status';
import { Table, TableScroll, TableWrap, Td, Th, Tr } from '@/components/ui/table';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPhone, formatRupiah, initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Penghuni' };

const TABS = [
  { value: 'ACTIVE', label: 'Penghuni aktif' },
  { value: 'ENDED', label: 'Penghuni lama' },
  { value: '', label: 'Semua' },
];

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  await requireAdmin();

  const status = searchParams.status ?? 'ACTIVE';

  const where: Prisma.TenancyWhereInput = {};
  if (status === 'ACTIVE') where.status = 'ACTIVE';
  if (status === 'ENDED') where.status = { in: ['ENDED', 'CANCELLED'] };
  if (searchParams.q) {
    where.OR = [
      { user: { fullName: { contains: searchParams.q, mode: 'insensitive' } } },
      { user: { username: { contains: searchParams.q, mode: 'insensitive' } } },
      { room: { number: { contains: searchParams.q, mode: 'insensitive' } } },
    ];
  }

  const [tenancies, activeCount, endedCount] = await Promise.all([
    prisma.tenancy.findMany({
      where,
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
      include: {
        user: { select: { id: true, fullName: true, username: true, phone: true } },
        room: { select: { number: true } },
        bills: { where: { status: { in: ['UNPAID', 'OVERDUE'] } }, select: { totalAmount: true } },
      },
    }),
    prisma.tenancy.count({ where: { status: 'ACTIVE' } }),
    prisma.tenancy.count({ where: { status: { in: ['ENDED', 'CANCELLED'] } } }),
  ]);

  const tabs = TABS.map((tab) => ({
    ...tab,
    count:
      tab.value === 'ACTIVE'
        ? activeCount
        : tab.value === 'ENDED'
          ? endedCount
          : activeCount + endedCount,
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        title="Penghuni"
        description="Daftar penghuni aktif beserta riwayat penghuni yang sudah check-out."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterTabs tabs={tabs} paramName="status" basePath="/kosku/admin/tenants" />
        <SearchInput placeholder="Cari nama penghuni..." className="sm:w-64" />
      </div>

      {tenancies.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users aria-hidden />}
            title="Belum ada penghuni"
            description="Penghuni akan muncul otomatis setelah booking dibayar."
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
                  <Th>Masa sewa</Th>
                  <Th className="text-right">Sewa/bulan</Th>
                  <Th className="text-right">Tunggakan</Th>
                  <Th>Status</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {tenancies.map((tenancy) => {
                  const arrears = tenancy.bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
                  return (
                    <Tr key={tenancy.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[11.5px] font-bold text-brand-ink">
                            {initials(tenancy.user.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-semibold text-ink">
                              {tenancy.user.fullName}
                            </p>
                            <p className="text-[11.5px] text-ink-muted">
                              {formatPhone(tenancy.user.phone)}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td className="font-medium text-ink">{tenancy.room.number}</Td>
                      <Td className="whitespace-nowrap text-[12.5px] text-ink-muted">
                        {formatDate(tenancy.startDate)}
                        <br />
                        s/d {formatDate(tenancy.endDate)}
                      </Td>
                      <Td className="whitespace-nowrap text-right font-medium text-ink">
                        {formatRupiah(tenancy.monthlyPrice)}
                      </Td>
                      <Td className="whitespace-nowrap text-right">
                        {arrears > 0 ? (
                          <span className="font-semibold text-danger">{formatRupiah(arrears)}</span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </Td>
                      <Td>
                        <TenancyStatusBadge status={tenancy.status} />
                      </Td>
                      <Td>
                        <Link
                          href={`/kosku/admin/tenants/${tenancy.user.id}`}
                          className="inline-flex size-8 items-center justify-center rounded-xs text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
                          aria-label={`Lihat detail ${tenancy.user.fullName}`}
                        >
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        </TableWrap>
      )}
    </div>
  );
}
