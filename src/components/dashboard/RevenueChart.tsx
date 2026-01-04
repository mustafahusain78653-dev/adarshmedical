"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export type MonthlyPoint = {
  month: string; // e.g. "Jan 2026"
  revenue: number;
  profit: number;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: unknown; value?: unknown }>;
  label?: unknown;
}) {
  if (!active || !payload?.length) return null;

  const revenue = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const profit = payload.find((p) => p.dataKey === "profit")?.value ?? 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-100 shadow-lg backdrop-blur">
      <div className="mb-1 text-sm font-semibold">{String(label)}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-zinc-300">Revenue</span>
        <span className="font-medium">₹ {Number(revenue).toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-zinc-300">Profit</span>
        <span className="font-medium text-green-400">₹ {Number(profit).toFixed(2)}</span>
      </div>
    </div>
  );
}

export function RevenueChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            interval="preserveStartEnd"
            minTickGap={18}
            angle={-30}
            textAnchor="end"
            height={40}
          />
          <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" fill="#e4e4e7" radius={[6, 6, 0, 0]} />
          <Bar dataKey="profit" fill="#16a34a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}




