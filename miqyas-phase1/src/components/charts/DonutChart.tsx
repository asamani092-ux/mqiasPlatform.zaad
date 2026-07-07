"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
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

export default function DonutChart({
  segments,
  centerLabel,
  centerSubLabel,
  height = 260,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerSubLabel?: string;
  height?: number;
}) {
  const data = segments.filter((s) => s.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="chart-empty" style={{ minHeight: height }}>
        لا توجد بيانات للعرض
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke={CHART_COLORS.surface}
            strokeWidth={2}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerSubLabel) && (
        <div className="donut-center">
          {centerLabel && <div className="donut-center-value">{centerLabel}</div>}
          {centerSubLabel && <div className="donut-center-label">{centerSubLabel}</div>}
        </div>
      )}
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={d.name} className="donut-legend-item">
            <span
              className="donut-legend-dot"
              style={{ background: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
            <span>{d.name}</span>
            <span className="donut-legend-val">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
