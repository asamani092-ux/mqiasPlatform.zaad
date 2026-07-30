"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";

export type DonutSegment = {
  name: string;
  value: number;
  color?: string;
};

const DEFAULT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.brandGray,
];

const REMAINDER_NAME = "__remainder__";

export default function DonutChart({
  segments,
  centerLabel,
  centerSubLabel,
  /** إن وُجدت: يملأ القوس الملون بهذه النسبة والمتبقي رمادي — يتزامن مع النسبة في المنتصف */
  progressPct,
  height = 260,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerSubLabel?: string;
  progressPct?: number | null;
  height?: number;
}) {
  const { pieData, legendData, weightTotal } = useMemo(() => {
    const positive = segments.filter((s) => s.value > 0);
    const total = positive.reduce((s, d) => s + d.value, 0);
    if (!positive.length || total <= 0) {
      return { pieData: [] as DonutSegment[], legendData: [] as DonutSegment[], weightTotal: 0 };
    }

    const capped =
      progressPct != null && Number.isFinite(progressPct)
        ? Math.max(0, Math.min(100, progressPct))
        : null;

    if (capped == null) {
      return { pieData: positive, legendData: positive, weightTotal: total };
    }

    const scaled = positive.map((s) => ({
      ...s,
      value: (s.value / total) * capped,
    }));
    const remainder = Math.max(0, 100 - capped);
    const pie =
      remainder > 0.05
        ? [
            ...scaled,
            {
              name: REMAINDER_NAME,
              value: remainder,
              color: CHART_COLORS.surfaceBorder,
            },
          ]
        : scaled;

    return { pieData: pie, legendData: positive, weightTotal: total };
  }, [segments, progressPct]);

  if (!pieData.length) {
    return (
      <div className="chart-empty" style={{ minHeight: height }}>
        لا توجد بيانات للعرض
      </div>
    );
  }

  const legendTotal = legendData.reduce((s, d) => s + d.value, 0);
  const pieHeight = Math.max(180, height - 56);

  return (
    <div className="donut-chart" style={{ width: "100%", minHeight: height }}>
      <div className="donut-chart-plot" style={{ height: pieHeight, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={progressPct != null ? 1.5 : 2}
              stroke={CHART_COLORS.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {pieData.map((entry, i) => (
                <Cell
                  key={`${entry.name}-${i}`}
                  fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                if (name === REMAINDER_NAME) {
                  return [`${Number(value ?? 0).toFixed(1)}%`, "المتبقي للمستهدف"];
                }
                const n = Number(value ?? 0);
                if (progressPct != null) return [`${n.toFixed(1)} نقطة`, String(name)];
                const share = weightTotal > 0 ? Math.round((n / weightTotal) * 100) : 0;
                return [`${share}%`, String(name)];
              }}
              contentStyle={{
                background: CHART_COLORS.surface,
                border: `1px solid ${CHART_COLORS.surfaceBorder}`,
                borderRadius: "0.5rem",
                fontFamily: "inherit",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerSubLabel) && (
          <div className="donut-center">
            {centerLabel && <div className="donut-center-value">{centerLabel}</div>}
            {centerSubLabel && <div className="donut-center-label">{centerSubLabel}</div>}
          </div>
        )}
      </div>
      <div className="donut-legend">
        {legendData.map((d, i) => (
          <div key={d.name} className="donut-legend-item">
            <span
              className="donut-legend-dot"
              style={{ background: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
            <span>{d.name}</span>
            <span className="donut-legend-val">
              {progressPct != null
                ? `${d.value}%`
                : `${legendTotal > 0 ? Math.round((d.value / legendTotal) * 100) : 0}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
