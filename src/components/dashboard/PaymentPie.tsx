"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type PiePoint = { name: string; value: number };

const COLORS = ["#e4e4e7", "#60a5fa", "#22c55e", "#f59e0b", "#f97316"];

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: unknown; value?: unknown }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-100 shadow-lg backdrop-blur">
      <div className="text-sm font-semibold">{String(p.name)}</div>
      <div className="mt-1 text-zinc-300">₹ {Number(p.value ?? 0).toFixed(2)}</div>
    </div>
  );
}

export function PaymentPie({ data }: { data: PiePoint[] }) {
  const total = data.reduce((s, x) => s + Number(x.value || 0), 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<PieTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="-mt-4 text-center text-xs text-zinc-400">Total: ₹ {total.toFixed(2)}</div>
    </div>
  );
}


