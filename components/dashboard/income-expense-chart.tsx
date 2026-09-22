'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatRupiah, formatRupiahShort } from '@/lib/format';

export type FinancePoint = { label: string; pemasukan: number; pengeluaran: number };

export function IncomeExpenseChart({ data }: { data: FinancePoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(36 14% 91%)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(214 12% 44%)' }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(214 12% 44%)' }}
            tickFormatter={(value: number) => formatRupiahShort(value).replace('Rp ', '')}
            width={64}
          />
          <Tooltip
            cursor={{ fill: 'hsl(40 18% 96%)' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid hsl(36 14% 91%)',
              boxShadow: '0 8px 32px -8px rgb(17 24 39 / 0.18)',
              fontSize: 12,
              padding: '10px 12px',
            }}
            labelStyle={{ color: 'hsl(214 12% 44%)', marginBottom: 4, fontSize: 11 }}
            formatter={(value: number, name: string) => [formatRupiah(value), name]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar
            dataKey="pemasukan"
            name="Pemasukan"
            fill="hsl(174 72% 26%)"
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="pengeluaran"
            name="Pengeluaran"
            fill="hsl(24 58% 70%)"
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
