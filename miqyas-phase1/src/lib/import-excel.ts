import * as XLSX from "xlsx";
import type { Frequency, KpiType, Period, Polarity } from "@prisma/client";
import { mapDepartmentName } from "@/lib/department-map";

export type ImportRowStatus = "NEW" | "UPDATE" | "ERROR";

export type ParsedImportRow = {
  rowNum: number;
  goalCode: string;
  code: string;
  name: string;
  type: KpiType;
  unit: string;
  polarity: Polarity;
  frequency: Frequency;
  requiredData: string;
  ownerLabel: string | null;
  departmentId: number | null;
  baseline: number | null;
  annualTarget: number | null;
  period: Period;
  periodTarget: number | null;
  actualValue: number | null;
  whatHappened: string | null;
  howHappened: string | null;
  recommendation: string | null;
  approvalStatus: "APPROVED" | "PENDING";
  status: ImportRowStatus;
  error?: string;
  existingKpiId?: number;
};

const SHEET_PERIOD: Record<string, Period> = {
  "الأول": "Q1",
  "الثاني": "Q2",
  "الثالث": "Q3",
  "الرابع": "Q4",
};

function parseNum(v: unknown, unit: string): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, "").trim());
  if (Number.isNaN(n)) return null;
  if (unit.includes("نسبة") && n > 0 && n <= 1) return n;
  return n;
}

function mapType(v: string): KpiType {
  return v.includes("تشغيل") ? "OPERATIONAL" : "STRATEGIC";
}

function mapFreq(v: string): Frequency {
  if (v.includes("نصف")) return "SEMI_ANNUAL";
  if (v.includes("سنو") && !v.includes("ربع")) return "ANNUAL";
  return "QUARTERLY";
}

function mapPolarity(v: string): Polarity {
  return v.includes("قل") ? "LOWER_BETTER" : "HIGHER_BETTER";
}

function detectPeriod(sheetName: string, headers: string[]): Period {
  for (const [ar, p] of Object.entries(SHEET_PERIOD)) {
    if (sheetName.includes(ar)) return p as Period;
  }
  const h = headers.join(" ");
  for (const [ar, p] of Object.entries(SHEET_PERIOD)) {
    if (h.includes(ar) || h.includes(p)) return p as Period;
  }
  return "Q1";
}

function colIndex(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i] || "";
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

function parseSheet(
  ws: XLSX.WorkSheet,
  sheetName: string,
  departments: { id: number; name: string }[],
  existingCodes: Map<string, number>,
  year: number,
): ParsedImportRow[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i] as string[];
    if (row.some((c) => String(c).includes("رمزالمؤشر") || String(c).includes("رمزالهدف"))) {
      headerIdx = i;
      break;
    }
  }

  const headers = (rows[headerIdx] as string[]).map((h) => String(h).trim());
  const period = detectPeriod(sheetName, headers);

  const idx = {
    goalCode: colIndex(headers, [/رمز.*هدف/]),
    code: colIndex(headers, [/رمز.*مؤشر/]),
    name: colIndex(headers, [/المؤشر|اسم المؤشر/]),
    type: colIndex(headers, [/نوع المؤشر/]),
    unit: colIndex(headers, [/وحدة/]),
    direction: colIndex(headers, [/إتجاه|اتجاه/]),
    frequency: colIndex(headers, [/دورية/]),
    requiredData: colIndex(headers, [/البيانات المطلوبة/]),
    dept: colIndex(headers, [/الإدارة المالكة/]),
    baseline: colIndex(headers, [/خط الأساس/]),
    annualTarget: colIndex(headers, [/مستهدف عام/]),
    periodTarget: colIndex(headers, [/المستهدف للربع|المستهدف/]),
    actual: colIndex(headers, [/المتحقق الفعلي/]),
    what: colIndex(headers, [/ماذا حصل/]),
    how: colIndex(headers, [/كيف حصل/]),
    approval: colIndex(headers, [/حالة.*اعتماد|حالة.*إعتماد/]),
    recommendation: colIndex(headers, [/توصيات/]),
  };

  if (idx.code < 0) return [];

  const out: ParsedImportRow[] = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const code = String(row[idx.code] ?? "").trim();
    if (!code) continue;

    const unit = String(row[idx.unit] ?? "%").trim() || "%";
    let error: string | undefined;

    try {
      const typeRaw = String(row[idx.type] ?? "");
      const freqRaw = String(row[idx.frequency] ?? "ربع سنوي");
      const dirRaw = String(row[idx.direction] ?? "");
      const deptRaw = String(row[idx.dept] ?? "");
      const { departmentId, ownerLabel } = mapDepartmentName(deptRaw, departments);

      const parsed: ParsedImportRow = {
        rowNum: r + 1,
        goalCode: String(row[idx.goalCode] ?? "").trim(),
        code,
        name: String(row[idx.name >= 0 ? idx.name : idx.code] ?? code).trim(),
        type: mapType(typeRaw),
        unit,
        polarity: mapPolarity(dirRaw),
        frequency: mapFreq(freqRaw),
        requiredData: String(row[idx.requiredData] ?? "").trim(),
        ownerLabel,
        departmentId,
        baseline: parseNum(row[idx.baseline], unit),
        annualTarget: parseNum(row[idx.annualTarget], unit),
        period,
        periodTarget: parseNum(row[idx.periodTarget], unit),
        actualValue: parseNum(row[idx.actual], unit),
        whatHappened: idx.what >= 0 ? String(row[idx.what] ?? "").trim() || null : null,
        howHappened: idx.how >= 0 ? String(row[idx.how] ?? "").trim() || null : null,
        recommendation: idx.recommendation >= 0 ? String(row[idx.recommendation] ?? "").trim() || null : null,
        approvalStatus: String(row[idx.approval] ?? "").includes("معتمد") ? "APPROVED" : "PENDING",
        status: existingCodes.has(code) ? "UPDATE" : "NEW",
        existingKpiId: existingCodes.get(code),
      };

      if (!parsed.name) error = "اسم المؤشر فارغ";
      out.push(error ? { ...parsed, status: "ERROR", error } : parsed);
    } catch (e) {
      out.push({
        rowNum: r + 1,
        goalCode: "",
        code,
        name: code,
        type: "STRATEGIC",
        unit: "%",
        polarity: "HIGHER_BETTER",
        frequency: "QUARTERLY",
        requiredData: "",
        ownerLabel: null,
        departmentId: null,
        baseline: null,
        annualTarget: null,
        period,
        periodTarget: null,
        actualValue: null,
        whatHappened: null,
        howHappened: null,
        recommendation: null,
        approvalStatus: "PENDING",
        status: "ERROR",
        error: e instanceof Error ? e.message : "خطأ في التحليل",
      });
    }
  }

  return out;
}

export function parseWorkbook(
  buffer: Buffer,
  departments: { id: number; name: string }[],
  existingCodes: Map<string, number>,
  year = 2026,
): ParsedImportRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const byCode = new Map<string, ParsedImportRow>();

  for (const sheetName of wb.SheetNames) {
    if (!sheetName.includes("قياس الأداء") && sheetName !== "ادخال بيانات") continue;
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = parseSheet(ws, sheetName, departments, existingCodes, year);
    for (const row of rows) {
      const key = `${row.code}:${row.period}`;
      if (!byCode.has(key) || row.status !== "ERROR") {
        byCode.set(key, row);
      }
    }
  }

  return Array.from(byCode.values());
}

export async function dryRunImport(
  buffer: Buffer,
  departments: { id: number; name: string }[],
  existingCodes: Map<string, number>,
  year = 2026,
) {
  const rows = parseWorkbook(buffer, departments, existingCodes, year);
  return {
    rows,
    summary: {
      total: rows.length,
      new: rows.filter((r) => r.status === "NEW").length,
      update: rows.filter((r) => r.status === "UPDATE").length,
      errors: rows.filter((r) => r.status === "ERROR").length,
    },
  };
}
