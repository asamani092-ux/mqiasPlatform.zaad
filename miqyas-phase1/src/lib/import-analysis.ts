import type { KpiStatus, Period } from "@/lib/types";
import type { ParsedImportRow } from "@/lib/import-excel";

const ALL_QUARTERS: Period[] = ["Q1", "Q2", "Q3", "Q4"];

/** تحليل تغطية الرموز عبر الأرباع */
export function analyzeImportCodes(rows: ParsedImportRow[]) {
  const byCode = new Map<string, Set<Period>>();
  for (const row of rows) {
    if (row.status === "ERROR" || !row.code) continue;
    if (!byCode.has(row.code)) byCode.set(row.code, new Set());
    byCode.get(row.code)!.add(row.period);
  }

  const uniqueCodes = Array.from(byCode.keys()).sort();
  const quarterOnly: { code: string; periods: Period[]; missing: Period[] }[] = [];

  for (const [code, periods] of Array.from(byCode.entries())) {
    const present = Array.from(periods);
    const missing = ALL_QUARTERS.filter((q) => !periods.has(q));
    if (present.length < ALL_QUARTERS.length) {
      quarterOnly.push({ code, periods: present, missing });
    }
  }

  return { uniqueCodes, quarterOnlyFlags: quarterOnly };
}
