import type { Period } from "@prisma/client";
import { currentQuarter } from "@/lib/kpi";
import { getSetting } from "@/lib/settings";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = String(raw).trim();
  return trimmed === "" ? undefined : trimmed;
}

/** سنة/فترة من searchParams، وإلا من إعدادات النظام، وإلا الربع الحالي بالتقويم */
export async function parseTrackParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const { year: cy, period: cp } = currentQuarter();
  const yearParam = firstParam(searchParams.year);
  const periodParam = firstParam(searchParams.period);

  let year: number;
  if (yearParam != null) {
    year = parseInt(yearParam, 10);
    if (Number.isNaN(year)) year = cy;
  } else {
    const settingYear = await getSetting("current_year");
    const parsed = parseInt(settingYear, 10);
    year = Number.isNaN(parsed) ? cy : parsed;
  }

  let period: Period;
  if (periodParam != null) {
    period = periodParam as Period;
  } else {
    const settingPeriod = await getSetting("current_period");
    period = (settingPeriod as Period) || cp;
  }

  return { year, period };
}
