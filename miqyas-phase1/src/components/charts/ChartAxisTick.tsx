"use client";

import { CHART_COLORS } from "@/lib/chart-colors";

/** يلف نص محور X أسفل الخط حتى لا يدخل منطقة الرسم */
export function wrapAxisLabel(value: string, maxChars = 12): string[] {
  const text = String(value ?? "").trim();
  if (!text) return [""];
  if (text.length <= maxChars) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      if (word.length > maxChars) {
        for (let i = 0; i < word.length; i += maxChars) {
          lines.push(word.slice(i, i + maxChars));
        }
        current = "";
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

type TickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
  maxChars?: number;
  fontSize?: number;
};

/** تسمية أفقية ملتفّة تحت المحور — تُستخدم في كل مخططات كارتزيان */
export default function ChartAxisTick({
  x = 0,
  y = 0,
  payload,
  maxChars = 12,
  fontSize = 11,
}: TickProps) {
  const lines = wrapAxisLabel(String(payload?.value ?? ""), maxChars);
  const lineHeight = fontSize + 3;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={`${line}-${i}`}
          x={0}
          y={0}
          dy={14 + i * lineHeight}
          textAnchor="middle"
          fill={CHART_COLORS.brandGray}
          fontSize={fontSize}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
