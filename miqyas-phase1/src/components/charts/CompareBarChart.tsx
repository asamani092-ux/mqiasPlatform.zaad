"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import ChartAxisTick from "@/components/charts/ChartAxisTick";

export type CompareBarItem = {
  name: string;
  value: number;
  color: string;
};

export default function CompareBarChart({
  items,
  height = 180,
  valueSuffix = "",
}: {
  items: CompareBarItem[];
  height?: number;
  valueSuffix?: string;
}) {
  const data = items.filter((d) => d.value >= 0);

  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="chart-empty" style={{ minHeight: height }}>
        لا توجد بيانات للعرض
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surfaceBorder} vertical={false} />
          <XAxis
            dataKey="name"
            interval={0}
            tick={<ChartAxisTick maxChars={11} />}
            tickLine={false}
            height={64}
            tickMargin={4}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: CHART_COLORS.brandGray, fontSize: 11 }}
            width={36}
          />
          <Tooltip
            formatter={(v) => [`${v}${valueSuffix}`, "العدد"]}
            contentStyle={{
              background: CHART_COLORS.surface,
              border: `1px solid ${CHART_COLORS.surfaceBorder}`,
              borderRadius: "0.5rem",
              fontFamily: "inherit",
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
