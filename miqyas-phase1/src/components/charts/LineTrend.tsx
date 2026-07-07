"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";

export type TrendPoint = {
  label: string;
  value: number | null;
};

export default function LineTrend({
  points,
  height = 200,
  lineColor = CHART_COLORS.primary,
}: {
  points: TrendPoint[];
  height?: number;
  lineColor?: string;
}) {
  const data = points.map((p) => ({ ...p, display: p.value ?? 0, hasValue: p.value != null }));

  if (!data.some((d) => d.hasValue)) {
    return (
      <div className="chart-empty" style={{ minHeight: height }}>
        لا توجد قياسات معتمدة للاتجاه الزمني
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surfaceBorder} />
          <XAxis dataKey="label" tick={{ fill: CHART_COLORS.brandGray, fontSize: 11 }} />
          <YAxis
            domain={[0, "auto"]}
            tick={{ fill: CHART_COLORS.brandGray, fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(v, _n, p) => {
              const row = p?.payload as { hasValue?: boolean; value?: number | null } | undefined;
              if (row?.hasValue && row.value != null) return [`${row.value}%`, "نسبة الإنجاز"];
              return ["—", "نسبة الإنجاز"];
            }}
            contentStyle={{
              background: CHART_COLORS.surface,
              border: `1px solid ${CHART_COLORS.surfaceBorder}`,
              borderRadius: "0.5rem",
              fontFamily: "inherit",
            }}
          />
          <Line
            type="monotone"
            dataKey="display"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ r: 4, fill: lineColor, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
