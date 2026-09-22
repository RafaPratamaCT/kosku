import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Ban, Download, MessageCircle } from 'lucide-react';

import { CheckoutForm } from '@/components/admin/checkout-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { Alert, EmptyState } from '@/components/ui/misc';
import { BillStatusBadge, TenancyStatusBadge } from '@/components/ui/status';
import { Table, TableScroll, Td, Th, Tr } from '@/components/ui/table';
import { returnDepositAction, toggleUserActiveAction } from '@/lib/actions/admin-misc';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  formatDate,
  formatPeriod,
  formatPhone,
  formatRupiah,
  initials,
  waLink,
} from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Detail penghuni' };

export default async function AdminTenantDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      tenancies: {
        orderBy: { createdAt: 'desc' },
        include: {
          room: { select: { id: true, number: true, type: true } },
          bills: {
            orderBy: { dueDate: 'desc' },
            select: {
              id: true,
              period: true,
              dueDate: true,
              totalAmount: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!user || user.role !== 'TENANT') notFound();

  const activeTenancy = user.tenancies.find((tenancy) => tenancy.status === 'ACTIVE');
  const bills = user.tenancies.flatMap((tenancy) => tenancy.bills);
  const arrears = bills
    .filter((bill) => bill.status === 'UNPAID' || bill.status === 'OVERDUE')
    .reduce((sum, bill) => sum + bill.totalAmount, 0);
  const paidTotal = bills
    .filter((bill) => bill.status === 'PAID')
    .reduce((sum, bill) => sum + bill.totalAmount, 0);

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link
          href="/kosku/admin/tenants"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar penghuni
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-xl bg-brand-soft text-[17px] font-bold text-brand-ink">
              {initials(user.fullName)}
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[22px] font-bold leading-tight text-ink">{user.fullName}</h1>
                {!user.isActive ? <Badge tone="danger">Nonaktif</Badge> : null}
              </div>
              <p className="text-[13px] text-ink-muted">
                @{user.username} · Bergabung {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <ExternalButtonLink
              href={waLink(user.phone)}
              variant="outline"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle aria-hidden />
              WhatsApp
            </ExternalButtonLink>
            <form action={toggleUserActiveAction}>
              <input type="hidden" name="userId" value={user.id} />
              <Button type="submit" variant={user.isActive ? 'dangerSoft' : 'soft'}>
                {user.isActive ? <Ban aria-hidden /> : <BadgeCheck aria-hidden />}
                {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {arrears > 0 ? (
        <Alert tone="warn" title="Ada tunggakan">
          Total {formatRupiah(arrears)} belum dibayar. Check-out baru bisa diproses setelah semua
          tagihan lunas.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <h2 className="text-[15px] font-semibold text-ink">Data diri</h2>
            <dl className="space-y-2.5 text-[13px]">
              <Row label="Nomor HP" value={formatPhone(user.phone)} />
              <Row label="Email" value={user.email ?? '—'} />
              <Row label="Pekerjaan" value={user.occupation ?? '—'} />
              <Row label="Kontak darurat" value={user.emergencyName ?? '—'} />
              <Row
                label="No. kontak darurat"
                value={user.emergencyPhone ? formatPhone(user.emergencyPhone) : '—'}
              />
            </dl>

            {user.idCardUrl ? (
              <div className="space-y-2 border-t border-line pt-4">
                <p className="text-[12.5px] font-medium text-ink-muted">Foto KTP</p>
                <a href={user.idCardUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.idCardUrl}
                    alt={`KTP ${user.fullName}`}
                    className="w-full rounded-md border border-line object-cover transition hover:opacity-90"
                  />
                </a>
              </div>
            ) : null}
          </Card>

          {activeTenancy ? (
            <Card className="space-y-4 p-6">
              <h2 className="text-[15px] font-semibold text-ink">Sewa berjalan</h2>
              <dl className="space-y-2.5 text-[13px]">
                <Row
                  label="Kamar"
                  value={`${activeTenancy.room.number} · ${activeTenancy.room.type}`}
                />
                <Row label="Mulai" value={formatDate(activeTenancy.startDate)} />
                <Row label="Berakhir" value={formatDate(activeTenancy.endDate)} />
                <Row label="Sewa/bulan" value={formatRupiah(activeTenancy.monthlyPrice)} />
                <Row label="Deposit" value={formatRupiah(activeTenancy.depositAmount)} />
                <Row
                  label="Status deposit"
                  value={activeTenancy.depositReturned ? 'Sudah dikembalikan' : 'Masih ditahan'}
                />
              </dl>

              <div className="space-y-3 border-t border-line pt-4">
                <ExternalButtonLink
                  href={`/api/documents/contract/${activeTenancy.id}`}
                  variant="outline"
                  className="block w-full"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download aria-hidden />
                  Unduh kontrak PDF
                </ExternalButtonLink>

                <CheckoutForm
                  tenancyId={activeTenancy.id}
                  depositAmount={activeTenancy.depositAmount}
                  hasArrears={arrears > 0}
                />
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <EmptyState
                title="Tidak ada sewa aktif"
                description="Penghuni ini sedang tidak menempati kamar."
              />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-[12.5px] font-medium text-ink-muted">Total sudah dibayar</p>
              <p className="mt-1 text-[22px] font-bold leading-none text-ink">
                {formatRupiah(paidTotal)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[12.5px] font-medium text-ink-muted">Tunggakan</p>
              <p
                className={`mt-1 text-[22px] font-bold leading-none ${
                  arrears > 0 ? 'text-danger' : 'text-ink'
                }`}
              >
                {formatRupiah(arrears)}
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Tagihan penghuni</h2>
            </div>
            {bills.length === 0 ? (
              <EmptyState title="Belum ada tagihan" />
            ) : (
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>Periode</Th>
                      <Th>Jatuh tempo</Th>
                      <Th className="text-right">Jumlah</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Detail</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <Tr key={bill.id}>
                        <Td className="font-medium text-ink">{formatPeriod(bill.period)}</Td>
                        <Td className="text-ink-muted">{formatDate(bill.dueDate)}</Td>
                        <Td className="text-right font-semibold text-ink">
                          {formatRupiah(bill.totalAmount)}
                        </Td>
                        <Td>
                          <BillStatusBadge status={bill.status} />
                        </Td>
                        <Td className="text-right">
                          <Link
                            href={`/kosku/admin/bills/${bill.id}`}
                            className="text-[13px] font-semibold text-brand hover:underline"
                          >
                            Buka
                          </Link>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Riwayat sewa</h2>
            </div>
            <ul className="divide-y divide-line">
              {user.tenancies.map((tenancy) => (
                <li
                  key={tenancy.id}
                  className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">
                      Kamar {tenancy.room.number}
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      {formatDate(tenancy.startDate)} – {formatDate(tenancy.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tenancy.status === 'ENDED' && !tenancy.depositReturned ? (
                      <form action={returnDepositAction}>
                        <input type="hidden" name="tenancyId" value={tenancy.id} />
                        <Button type="submit" size="sm" variant="soft">
                          Tandai deposit dikembalikan
                        </Button>
                      </form>
                    ) : null}
                    <TenancyStatusBadge status={tenancy.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
