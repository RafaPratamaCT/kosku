'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatRupiah, formatRupiahShort } from '@/lib/format';

export type RevenuePoint = { label: string; value: number };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(174 72% 26%)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="hsl(174 72% 26%)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            cursor={{ stroke: 'hsl(36 12% 85%)', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid hsl(36 14% 91%)',
              boxShadow: '0 8px 32px -8px rgb(17 24 39 / 0.18)',
              fontSize: 12,
              padding: '10px 12px',
            }}
            labelStyle={{ color: 'hsl(214 12% 44%)', marginBottom: 4, fontSize: 11 }}
            formatter={(value: number) => [formatRupiah(value), 'Pemasukan']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(174 72% 26%)"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
