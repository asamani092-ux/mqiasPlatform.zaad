"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { STATUS5_COLOR, type Status5 } from "@/lib/status5";

export type BarTargetItem = {
  name: string;
  value: number;
  status5: Status5;
  isOverall?: boolean;
};

export default function BarChartWithTarget({
  items,
  targetValue = 100,
  height = 300,
}: {
  items: BarTargetItem[];
  targetValue?: number;
  height?: number;
}) {
  const data = items.filter((d) => d.value > 0 || d.isOverall);

  if (!data.length) {
    return (
      <div className="chart-empty" style={{ minHeight: height }}>
        لا توجد بيانات للعرض
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surfaceBorder} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: CHART_COLORS.brandGray, fontSize: 11 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={56}
          />
          <YAxis
            domain={[0, "auto"]}
            tick={{ fill: CHART_COLORS.brandGray, fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(v) => [`${v ?? 0}%`, "نسبة الإنجاز"]}
            contentStyle={{
              background: CHART_COLORS.surface,
              border: `1px solid ${CHART_COLORS.surfaceBorder}`,
              borderRadius: "0.5rem",
              fontFamily: "inherit",
            }}
          />
          <ReferenceLine
            y={targetValue}
            stroke={CHART_COLORS.targetLine}
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: "المستهدف",
              position: "insideTopRight",
              fill: CHART_COLORS.targetLine,
              fontSize: 11,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={STATUS5_COLOR[entry.status5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
