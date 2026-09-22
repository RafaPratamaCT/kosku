import Link from 'next/link';
import { CircleAlert, Download, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { ExpenseForm } from '@/components/admin/expense-form';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { ExternalButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { BillStatusBadge } from '@/components/ui/status';
import { Table, TableScroll, Td, Th, Tr } from '@/components/ui/table';
import { deleteExpenseAction } from '@/lib/actions/admin-billing';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPeriod, formatRupiah, formatRupiahShort } from '@/lib/format';
import { expensesByMonth, expenseOfMonth, revenueByMonth, revenueOfMonth } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Laporan keuangan' };

function toInputDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export default async function AdminFinancePage() {
  await requireAdmin();

  const now = new Date();

  const [revenueSeries, expenseSeries, monthRevenue, monthExpense, arrears, expenses] =
    await Promise.all([
      revenueByMonth(12),
      expensesByMonth(12),
      revenueOfMonth(now),
      expenseOfMonth(now),
      prisma.bill.findMany({
        where: { status: { in: ['UNPAID', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
        include: {
          tenancy: {
            select: {
              room: { select: { number: true } },
              user: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
      prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 20 }),
    ]);

  const chartData = revenueSeries.map((point, index) => ({
    label: point.label,
    pemasukan: point.value,
    pengeluaran: expenseSeries[index]?.value ?? 0,
  }));

  const yearRevenue = revenueSeries.reduce((sum, point) => sum + point.value, 0);
  const yearExpense = expenseSeries.reduce((sum, point) => sum + point.value, 0);
  const arrearsTotal = arrears.reduce((sum, bill) => sum + bill.totalAmount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan keuangan"
        description="Pemasukan, pengeluaran, laba bersih, dan daftar tunggakan dalam 12 bulan terakhir."
        action={
          <ExternalButtonLink href="/api/reports/finance?months=12" variant="outline" download>
            <Download aria-hidden />
            Export CSV
          </ExternalButtonLink>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pemasukan bulan ini"
          value={formatRupiahShort(monthRevenue)}
          icon={<TrendingUp aria-hidden />}
          tone="mint"
        />
        <StatCard
          label="Pengeluaran bulan ini"
          value={formatRupiahShort(monthExpense)}
          icon={<TrendingDown aria-hidden />}
          tone="peach"
        />
        <StatCard
          label="Laba bersih bulan ini"
          value={formatRupiahShort(monthRevenue - monthExpense)}
          icon={<Wallet aria-hidden />}
          tone="brand"
        />
        <StatCard
          label="Total tunggakan"
          value={formatRupiahShort(arrearsTotal)}
          hint={`${arrears.length} tagihan`}
          icon={<CircleAlert aria-hidden />}
          tone="lilac"
        />
      </div>

      <Card className="p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              Pemasukan vs pengeluaran 12 bulan
            </h2>
            <p className="text-[12.5px] text-ink-muted">
              Laba bersih setahun {formatRupiah(yearRevenue - yearExpense)}
            </p>
          </div>
          <div className="flex gap-5 text-[12.5px]">
            <div>
              <p className="text-ink-muted">Pemasukan</p>
              <p className="font-semibold text-ink">{formatRupiah(yearRevenue)}</p>
            </div>
            <div>
              <p className="text-ink-muted">Pengeluaran</p>
              <p className="font-semibold text-ink">{formatRupiah(yearExpense)}</p>
            </div>
          </div>
        </div>
        <IncomeExpenseChart data={chartData} />
      </Card>

      <div className="grid gap-6">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Daftar tunggakan</h2>
          </div>
          {arrears.length === 0 ? (
            <EmptyState
              title="Tidak ada tunggakan"
              description="Semua tagihan sudah dibayar penghuni."
            />
          ) : (
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
                  </tr>
                </thead>
                <tbody>
                  {arrears.map((bill) => (
                    <Tr key={bill.id}>
                      <Td>
                        <Link
                          href={`/kosku/admin/bills/${bill.id}`}
                          className="text-[13.5px] font-semibold text-ink hover:underline"
                        >
                          {bill.tenancy.user.fullName}
                        </Link>
                      </Td>
                      <Td className="text-ink-muted">{bill.tenancy.room.number}</Td>
                      <Td className="text-ink-muted">{formatPeriod(bill.period)}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(bill.dueDate)}
                      </Td>
                      <Td className="whitespace-nowrap text-right font-semibold text-ink">
                        {formatRupiah(bill.totalAmount)}
                      </Td>
                      <Td>
                        <BillStatusBadge status={bill.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
        <Card className="space-y-5 p-6">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-ink">Catat pengeluaran</h2>
            <p className="text-[12.5px] leading-relaxed text-ink-muted">
              Listrik, air, internet, perawatan, dan biaya operasional lainnya.
            </p>
          </div>
          <ExpenseForm today={toInputDate(now)} />
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Pengeluaran terbaru</h2>
          </div>
          {expenses.length === 0 ? (
            <EmptyState title="Belum ada pengeluaran tercatat" />
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Tanggal</Th>
                    <Th>Kategori</Th>
                    <Th>Keterangan</Th>
                    <Th className="text-right">Nominal</Th>
                    <Th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <Tr key={expense.id}>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(expense.date)}
                      </Td>
                      <Td className="text-ink-muted">{expense.category}</Td>
                      <Td className="font-medium text-ink">
                        {expense.label}
                        {expense.note ? (
                          <span className="block text-[11.5px] font-normal text-ink-subtle">
                            {expense.note}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap text-right font-semibold text-ink">
                        {formatRupiah(expense.amount)}
                      </Td>
                      <Td>
                        <form action={deleteExpenseAction}>
                          <input type="hidden" name="expenseId" value={expense.id} />
                          <button
                            type="submit"
                            aria-label={`Hapus ${expense.label}`}
                            className="flex size-8 items-center justify-center rounded-xs text-ink-subtle transition hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </form>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </Card>
      </div>
    </div>
  );
}
