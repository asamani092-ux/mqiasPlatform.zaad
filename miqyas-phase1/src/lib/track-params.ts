import type { Period } from "@prisma/client";
import { currentQuarter } from "@/lib/kpi";

export function parseTrackParams(searchParams: Record<string, string | string[] | undefined>) {
  const { year: cy, period: cp } = currentQuarter();
  const year = parseInt(String(searchParams.year ?? cy), 10);
  const period = (String(searchParams.period ?? cp) as Period) || cp;
  return { year, period };
}
