// استيراد بيانات قياس الأداء 2026 من ملف Excel — UAT Phase 0
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import type { ApprovalStatus, Frequency, KpiType, Period, Polarity } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { normalizeDeptText } from "../src/lib/department-map";
import { achievementPct, deviationValue, kpiStatus } from "../src/lib/kpi";

const YEAR = 2026;
const EXCEL_PATH = path.join(__dirname, "../data/performance-2026.xlsx");
const DEMO_PASSWORD = "Demo@123456";
const SHEETS: { name: string; period: Period }[] = [
  { name: "قياس الأداء للربع الأول", period: "Q1" },
  { name: "قياس الأداء للربع الثاني", period: "Q2" },
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("يجب ضبط DATABASE_URL في ملف .env");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

type ParsedRow = {
  goalCode: string;
  code: string;
  name: string;
  type: KpiType;
  unit: string;
  polarity: Polarity;
  frequency: Frequency;
  requiredData: string;
  ownerDeptRaw: string;
  baseline: number | null;
  annualTarget: number | null;
  period: Period;
  periodTarget: number | null;
  actualValue: number | null;
  whatHappened: string | null;
  howHappened: string | null;
  recommendation: string | null;
  approvalStatus: ApprovalStatus;
};

type ImportCounts = {
  departments: number;
  strategicGoals: number;
  operationalGoals: number;
  kpis: number;
  kpiTargets: number;
  kpiEntries: number;
  users: number;
  rowsParsed: number;
  rowsSkipped: number;
};

const deptByNorm = new Map<string, { id: number; name: string }>();

function parseNum(v: unknown, unit: string): number | null {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number") {
    if (Number.isNaN(v)) return null;
    if (unit.includes("نسبة") && v > 0 && v <= 1) return v;
    if (unit.includes("نسبة") && v > 1 && v <= 100) return v / 100;
    return v;
  }

  let s = String(v).trim();
  if (!s) return null;

  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  s = s.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  s = s.replace(/٬/g, "").replace(/٫/g, ".");
  const isPercent = s.includes("%");
  s = s.replace(/%/g, "").replace(/,/g, "").trim();

  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;

  if (unit.includes("نسبة") || isPercent) {
    if (n > 1 && n <= 100) return n / 100;
    if (n > 0 && n <= 1) return n;
  }
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
  return v.includes("زاد") ? "HIGHER_BETTER" : "LOWER_BETTER";
}

function mapApproval(raw: string, hasActual: boolean): ApprovalStatus {
  const s = raw.trim();
  if (s.includes("معتمد")) return "APPROVED";
  if (s.includes("تحت المراجعة") || s.includes("معلق") || s.includes("بانتظار")) return "PENDING";
  // Excel 2026 غالباً بلا عمود اعتماد مملوء — نعتمد ذات الفعلي لفتح اللوحات والمسارات
  if (hasActual) return "APPROVED";
  return "PENDING";
}

function colIndex(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i] || "";
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

function cleanDeptName(raw: string): string {
  return raw
    .replace(/^إدارة\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSheet(ws: XLSX.WorkSheet, period: Period): ParsedRow[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
  let headerIdx = 1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i] as string[];
    if (row.some((c) => String(c).includes("رمزالمؤشر") || String(c).includes("رمزالهدف"))) {
      headerIdx = i;
      break;
    }
  }

  const headers = (rows[headerIdx] as string[]).map((h) => String(h).trim());
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

  const out: ParsedRow[] = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const code = String(row[idx.code] ?? "").trim();
    if (!code) continue;

    const unit = String(row[idx.unit] ?? "%").trim() || "%";
    const actualValue = parseNum(row[idx.actual], unit);
    const approvalRaw = idx.approval >= 0 ? String(row[idx.approval] ?? "") : "";

    out.push({
      goalCode: String(row[idx.goalCode] ?? "").trim(),
      code,
      name: String(row[idx.name >= 0 ? idx.name : idx.code] ?? code).trim() || code,
      type: mapType(String(row[idx.type] ?? "")),
      unit,
      polarity: mapPolarity(String(row[idx.direction] ?? "")),
      frequency: mapFreq(String(row[idx.frequency] ?? "ربع سنوي")),
      requiredData: String(row[idx.requiredData] ?? "").trim(),
      ownerDeptRaw: String(row[idx.dept] ?? "").trim(),
      baseline: parseNum(row[idx.baseline], unit),
      annualTarget: parseNum(row[idx.annualTarget], unit),
      period,
      periodTarget: parseNum(row[idx.periodTarget], unit),
      actualValue,
      whatHappened: idx.what >= 0 ? String(row[idx.what] ?? "").trim() || null : null,
      howHappened: idx.how >= 0 ? String(row[idx.how] ?? "").trim() || null : null,
      recommendation:
        idx.recommendation >= 0 ? String(row[idx.recommendation] ?? "").trim() || null : null,
      approvalStatus: mapApproval(approvalRaw, actualValue != null),
    });
  }

  return out;
}

function parseWorkbook(buffer: Buffer): ParsedRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const byKey = new Map<string, ParsedRow>();

  for (const { name, period } of SHEETS) {
    const ws = wb.Sheets[name];
    if (!ws) {
      console.warn(`⚠️  الورقة غير موجودة: ${name}`);
      continue;
    }
    for (const row of parseSheet(ws, period)) {
      byKey.set(`${row.code}:${row.period}`, row);
    }
  }

  return Array.from(byKey.values());
}

async function loadDepartments() {
  const depts = await db.department.findMany({ select: { id: true, name: true, deptNo: true } });
  deptByNorm.clear();
  for (const d of depts) {
    deptByNorm.set(normalizeDeptText(d.name), d);
  }
  return depts;
}

async function upsertDepartment(raw: string): Promise<{ departmentId: number | null; ownerLabel: string | null }> {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes("جميع الإدارات")) {
    return { departmentId: null, ownerLabel: trimmed || null };
  }
  if (trimmed.includes("،") || trimmed.includes(",")) {
    return { departmentId: null, ownerLabel: trimmed };
  }

  const norm = normalizeDeptText(trimmed);
  for (const [cachedNorm, dept] of Array.from(deptByNorm.entries())) {
    if (norm === cachedNorm || norm.includes(cachedNorm) || cachedNorm.includes(norm)) {
      return { departmentId: dept.id, ownerLabel: null };
    }
  }

  const max = await db.department.aggregate({ _max: { deptNo: true } });
  const deptNo = (max._max.deptNo ?? 0) + 1;
  const name = cleanDeptName(trimmed);
  const created = await db.department.create({ data: { deptNo, name } });
  deptByNorm.set(normalizeDeptText(name), created);
  return { departmentId: created.id, ownerLabel: null };
}

async function upsertStrategicGoal(code: string): Promise<number> {
  const goal = await db.strategicGoal.upsert({
    where: { code },
    update: {},
    create: { code, title: code, sortOrder: 0 },
  });
  return goal.id;
}

async function upsertOperationalGoal(code: string, departmentId: number): Promise<number> {
  const goal = await db.operationalGoal.upsert({
    where: { code },
    update: { departmentId },
    create: { code, title: code, departmentId },
  });
  return goal.id;
}

async function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`ملف Excel غير موجود: ${EXCEL_PATH}`);
  }

  const buffer = fs.readFileSync(EXCEL_PATH);
  const rows = parseWorkbook(buffer);
  console.log(`📄 تم تحليل ${rows.length} صفًا من Q1 و Q2`);

  await loadDepartments();
  const firstDept = await db.department.findFirst({ orderBy: { deptNo: "asc" } });
  const firstSection = await db.section.findFirst({ orderBy: { id: "asc" } });
  if (!firstDept) throw new Error("لا توجد إدارات — شغّل prisma db seed أولاً");

  const counts: ImportCounts = {
    departments: deptByNorm.size,
    strategicGoals: 0,
    operationalGoals: 0,
    kpis: 0,
    kpiTargets: 0,
    kpiEntries: 0,
    users: 0,
    rowsParsed: rows.length,
    rowsSkipped: 0,
  };

  const strategicGoalIds = new Set<number>();
  const operationalGoalIds = new Set<number>();
  const kpiIds = new Set<number>();
  const kpiCodesForEmployee: number[] = [];

  const adminEmail = process.env.ADMIN_EMAIL || "admin@zad.org.sa";
  let adminUser = await db.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    await db.user.update({
      where: { id: adminUser.id },
      data: { name: "قسم الاستراتيجية — إدارة الأداء والنمو" },
    });
    console.log("✅ تم تحديث اسم المشرف");
  } else {
    adminUser = await db.user.findFirst({ where: { role: "SYSTEM_ADMIN" } });
  }
  const adminUserId = adminUser?.id ?? 1;

  const kpiDefs = new Map<string, ParsedRow>();
  for (const row of rows) {
    const existing = kpiDefs.get(row.code);
    if (!existing || (!existing.name && row.name)) {
      kpiDefs.set(row.code, row);
    }
  }

  for (const row of Array.from(kpiDefs.values())) {
    const { departmentId, ownerLabel } = await upsertDepartment(row.ownerDeptRaw);
    counts.departments = deptByNorm.size;

    let strategicGoalId: number | undefined;
    let operationalGoalId: number | undefined;

    if (row.type === "STRATEGIC" && row.goalCode) {
      const code = row.goalCode.split("-")[0] || row.goalCode;
      strategicGoalId = await upsertStrategicGoal(code);
      strategicGoalIds.add(strategicGoalId);
    } else if (row.type === "OPERATIONAL" && row.goalCode) {
      const deptId = departmentId ?? firstDept.id;
      operationalGoalId = await upsertOperationalGoal(row.goalCode, deptId);
      operationalGoalIds.add(operationalGoalId);
    }

    const kpi = await db.kpi.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        name: row.name,
        type: row.type,
        unit: row.unit,
        polarity: row.polarity,
        frequency: row.frequency,
        requiredData: row.requiredData || null,
        departmentId,
        ownerLabel,
        baseline: row.baseline,
        annualTarget: row.annualTarget,
        recommendation: row.recommendation,
        strategicGoalId,
        operationalGoalId,
        active: true,
      },
      update: {
        name: row.name,
        type: row.type,
        unit: row.unit,
        polarity: row.polarity,
        frequency: row.frequency,
        requiredData: row.requiredData || null,
        departmentId,
        ownerLabel,
        baseline: row.baseline,
        annualTarget: row.annualTarget,
        recommendation: row.recommendation ?? undefined,
        strategicGoalId,
        operationalGoalId,
        active: true,
      },
    });

    kpiIds.add(kpi.id);
    if (kpiCodesForEmployee.length < 5) kpiCodesForEmployee.push(kpi.id);

    if (row.annualTarget != null) {
      await db.kpiTarget.upsert({
        where: { kpiId_year_period: { kpiId: kpi.id, year: YEAR, period: "Y" } },
        create: { kpiId: kpi.id, year: YEAR, period: "Y", targetValue: row.annualTarget },
        update: { targetValue: row.annualTarget },
      });
      counts.kpiTargets++;
    }
  }

  counts.kpis = kpiIds.size;
  counts.strategicGoals = strategicGoalIds.size;
  counts.operationalGoals = operationalGoalIds.size;

  for (const row of rows) {
    const kpi = await db.kpi.findUnique({ where: { code: row.code }, select: { id: true, polarity: true } });
    if (!kpi) {
      counts.rowsSkipped++;
      continue;
    }

    if (row.periodTarget != null) {
      await db.kpiTarget.upsert({
        where: { kpiId_year_period: { kpiId: kpi.id, year: YEAR, period: row.period } },
        create: { kpiId: kpi.id, year: YEAR, period: row.period, targetValue: row.periodTarget },
        update: { targetValue: row.periodTarget },
      });
      counts.kpiTargets++;
    }

    if (row.actualValue == null) continue;

    const target =
      row.periodTarget ??
      (
        await db.kpiTarget.findUnique({
          where: { kpiId_year_period: { kpiId: kpi.id, year: YEAR, period: row.period } },
        })
      )?.targetValue;

    const pct = target != null ? achievementPct(row.actualValue, target, row.polarity) : null;
    const devVal = target != null ? deviationValue(row.actualValue, target) : null;
    const status = kpiStatus(pct);

    await db.kpiEntry.upsert({
      where: { kpiId_year_period: { kpiId: kpi.id, year: YEAR, period: row.period } },
      create: {
        kpiId: kpi.id,
        year: YEAR,
        period: row.period,
        actualValue: row.actualValue,
        whatHappened: row.whatHappened,
        howHappened: row.howHappened,
        achievementPct: pct,
        deviationValue: devVal,
        status,
        enteredById: adminUserId,
        approvalStatus: row.approvalStatus,
        approvedAt: row.approvalStatus === "APPROVED" ? new Date() : null,
      },
      update: {
        actualValue: row.actualValue,
        whatHappened: row.whatHappened,
        howHappened: row.howHappened,
        achievementPct: pct,
        deviationValue: devVal,
        status,
        approvalStatus: row.approvalStatus,
        approvedAt: row.approvalStatus === "APPROVED" ? new Date() : null,
      },
    });
    counts.kpiEntries++;
  }

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const demoUsers: Array<{
    email: string;
    name: string;
    role: "EXECUTIVE" | "DEPT_MANAGER" | "SECTION_HEAD" | "EMPLOYEE";
    departmentId?: number;
    sectionId?: number;
  }> = [
    { email: "executive@zad.org.sa", name: "الإدارة العليا", role: "EXECUTIVE" },
    {
      email: "manager@zad.org.sa",
      name: "مدير إدارة",
      role: "DEPT_MANAGER",
      departmentId: firstDept.id,
    },
    {
      email: "head@zad.org.sa",
      name: "رئيس قسم",
      role: "SECTION_HEAD",
      departmentId: firstSection?.departmentId ?? firstDept.id,
      sectionId: firstSection?.id,
    },
    {
      email: "employee@zad.org.sa",
      name: "موظف",
      role: "EMPLOYEE",
      departmentId: firstSection?.departmentId ?? firstDept.id,
      sectionId: firstSection?.id,
    },
  ];

  for (const u of demoUsers) {
    await db.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash: demoHash,
        status: "ACTIVE",
        departmentId: u.departmentId ?? null,
        sectionId: u.sectionId ?? null,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: demoHash,
        role: u.role,
        status: "ACTIVE",
        departmentId: u.departmentId ?? null,
        sectionId: u.sectionId ?? null,
      },
    });
    counts.users++;
  }

  const employee = await db.user.findUnique({ where: { email: "employee@zad.org.sa" } });
  if (employee && kpiCodesForEmployee.length > 0) {
    await db.kpi.updateMany({
      where: { id: { in: kpiCodesForEmployee } },
      data: { ownerId: employee.id },
    });
  }

  // إبقاء عيّنة PENDING لقائمة الاعتماد في بيئة التجربة
  const approvalSample = await db.kpiEntry.findMany({
    where: { year: YEAR, approvalStatus: "APPROVED" },
    take: 5,
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (approvalSample.length > 0) {
    await db.kpiEntry.updateMany({
      where: { id: { in: approvalSample.map((e) => e.id) } },
      data: { approvalStatus: "PENDING", approvedAt: null },
    });
  }

  // عيّنة إنذار مبكر لصفحة /early-warning (الكرون يتخطى خارج نافذة الشهر الثالث)
  const alertCount = await db.earlyWarningAlert.count({ where: { year: YEAR } });
  if (alertCount === 0) {
    const sampleEntries = await db.kpiEntry.findMany({
      where: { year: YEAR, period: "Q2", approvalStatus: "APPROVED" },
      include: { kpi: { select: { name: true } } },
      take: 3,
      orderBy: { id: "asc" },
    });
    for (const e of sampleEntries) {
      const target = await db.kpiTarget.findUnique({
        where: { kpiId_year_period: { kpiId: e.kpiId, year: YEAR, period: "Q2" } },
      });
      if (!target) continue;
      const gap = Math.max(15, Math.round((100 - (e.achievementPct ?? 70)) * 10) / 10);
      await db.earlyWarningAlert.create({
        data: {
          kpiId: e.kpiId,
          year: YEAR,
          period: "Q2",
          expectedToDate: target.targetValue,
          actualToDate: e.actualValue,
          gapPct: gap,
          riskLevel: gap >= 30 ? "HIGH" : "MEDIUM",
          message: `فجوة تجريبية — ${e.kpi.name}`,
          recipients: "manager@zad.org.sa",
          emailSent: false,
        },
      });
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("✅ اكتمل استيراد Excel 2026");
  console.log("═══════════════════════════════════════");
  console.log(`  الإدارات:          ${counts.departments}`);
  console.log(`  أهداف استراتيجية:  ${counts.strategicGoals}`);
  console.log(`  أهداف تشغيلية:     ${counts.operationalGoals}`);
  console.log(`  مؤشرات (KPI):      ${counts.kpis}`);
  console.log(`  مستهدفات:          ${counts.kpiTargets}`);
  console.log(`  إدخالات فعلية:     ${counts.kpiEntries}`);
  console.log(`  مستخدمون تجريبيون: ${counts.users}`);
  console.log(`  صفوف محللة:        ${counts.rowsParsed}`);
  console.log(`  صفوف متخطاة:       ${counts.rowsSkipped}`);
  console.log("═══════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ فشل الاستيراد:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
