/**
 * بذرة بيئة التجربة (Demo)
 * ─────────────────────────────────────────────────────────────
 * من Excel يُؤخذ فقط: رموز/أسماء المؤشرات، النوع، الوحدة، الاتجاه،
 * الدورية، الإدارة المالكة، ورمز الهدف.
 *
 * لا يُستورد من Excel: خط الأساس، المستهدفات، الفعلي، الإنجاز،
 * التحليل، أو حالة الاعتماد — تُولَّد بيانات افتراضية متسقة
 * حتى لا يُخلط بينها وبين ملف القياس الرسمي.
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import type { Frequency, KpiType, Period, Polarity } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { mapDepartmentName, normalizeDeptText } from "../src/lib/department-map";
import { achievementPct, deviationValue, kpiStatus } from "../src/lib/kpi";
import { upsertMeasurementPeriod } from "../src/lib/measurement-sync";

const YEAR = 2026;
const EXCEL_PATH = path.join(__dirname, "../data/performance-2026.xlsx");
/** كلمة مرور حسابات العرض — من البيئة فقط، بلا افتراضي مضمّن */
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || process.env.TEST_USER_PASSWORD || "";
const DEMO_PERIODS: Period[] = ["Q1", "Q2"];
const SHEETS: { name: string; period: Period }[] = [
  { name: "قياس الأداء للربع الأول", period: "Q1" },
  { name: "قياس الأداء للربع الثاني", period: "Q2" },
];

if (process.env.ENABLE_UAT !== "true" && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error(
    "seed:excel لبيئة التجربة فقط — اضبط ENABLE_UAT=true أو ALLOW_DEMO_SEED=true",
  );
}
if (!DEMO_PASSWORD || DEMO_PASSWORD.length < 10) {
  throw new Error(
    "اضبط DEMO_USER_PASSWORD أو TEST_USER_PASSWORD (10+ أحرف) قبل seed:excel — بلا كلمة مرور مضمّنة في الكود",
  );
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("يجب ضبط DATABASE_URL في ملف .env");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

type KpiDef = {
  goalCode: string;
  code: string;
  name: string;
  type: KpiType;
  unit: string;
  polarity: Polarity;
  frequency: Frequency;
  requiredData: string;
  ownerDeptRaw: string;
};

type ImportCounts = {
  departments: number;
  strategicGoals: number;
  operationalGoals: number;
  kpis: number;
  kpiTargets: number;
  kpiEntries: number;
  users: number;
  defsParsed: number;
};

const deptByNorm = new Map<string, { id: number; name: string }>();

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

function colIndex(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i] || "";
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

/** تجزئة مستقرة لإنتاج أرقام افتراضية قابلة للتكرار */
function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isPercentUnit(unit: string): boolean {
  const u = unit.trim();
  return u === "%" || u.includes("نسبة") || u.includes("%");
}

/**
 * يولّد خط أساس / مستهدف سنوي / مستهدف ربعي / فعلي افتراضيّاً.
 * Time O(1) · Space O(1)
 */
function syntheticMetrics(code: string, unit: string, polarity: Polarity, period: Period) {
  const h = stableHash(`${code}|${unit}|${period}`);
  const pctUnit = isPercentUnit(unit);
  const band = (h % 1000) / 1000;

  const annualTarget = pctUnit
    ? round2(55 + band * 40) // 55–95
    : round2(80 + band * 920); // 80–1000

  const baseline = round2(annualTarget * (0.45 + (h % 30) / 100)); // ~45–74% من السنوي
  const quarterShare = period === "Q1" ? 0.22 : 0.48;
  const periodTarget = pctUnit
    ? round2(50 + ((h >> 3) % 40)) // 50–89
    : round2(annualTarget * quarterShare);

  // نسبة إنجاز افتراضية بين ~55% و ~118%
  const achFactor = 0.55 + ((h >> 7) % 64) / 100;
  let actualValue: number;
  if (polarity === "LOWER_BETTER") {
    actualValue = round2(periodTarget / Math.max(achFactor, 0.55));
  } else {
    actualValue = round2(periodTarget * achFactor);
  }

  return { baseline, annualTarget, periodTarget, actualValue };
}

function parseDefsFromSheet(ws: XLSX.WorkSheet): KpiDef[] {
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
  };

  if (idx.code < 0) return [];

  const out: KpiDef[] = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const code = String(row[idx.code] ?? "").trim();
    if (!code) continue;

    out.push({
      goalCode: String(row[idx.goalCode] ?? "").trim(),
      code,
      name: String(row[idx.name >= 0 ? idx.name : idx.code] ?? code).trim() || code,
      type: mapType(String(row[idx.type] ?? "")),
      unit: String(row[idx.unit] ?? "%").trim() || "%",
      polarity: mapPolarity(String(row[idx.direction] ?? "")),
      frequency: mapFreq(String(row[idx.frequency] ?? "ربع سنوي")),
      requiredData: String(row[idx.requiredData] ?? "").trim(),
      ownerDeptRaw: String(row[idx.dept] ?? "").trim(),
    });
  }
  return out;
}

function parseWorkbookDefs(buffer: Buffer): KpiDef[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const byCode = new Map<string, KpiDef>();

  for (const { name } of SHEETS) {
    const ws = wb.Sheets[name];
    if (!ws) {
      console.warn(`⚠️  الورقة غير موجودة: ${name}`);
      continue;
    }
    for (const def of parseDefsFromSheet(ws)) {
      if (!byCode.has(def.code)) byCode.set(def.code, def);
    }
  }

  return Array.from(byCode.values());
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
  const departments = Array.from(deptByNorm.values()).map((d) => ({ id: d.id, name: d.name }));
  const mapped = mapDepartmentName(raw, departments);
  if (mapped.departmentId != null || mapped.ownerLabel != null) {
    return mapped;
  }
  const trimmed = raw.trim();
  return { departmentId: null, ownerLabel: trimmed || null };
}

async function mergeDuplicateDepartments() {
  const all = await db.department.findMany({ orderBy: { deptNo: "asc" } });
  const canonical = all.filter((d) => d.deptNo >= 1 && d.deptNo <= 6);
  const extras = all.filter((d) => d.deptNo > 6);
  for (const extra of extras) {
    const mapped = mapDepartmentName(extra.name, canonical);
    const targetId = mapped.departmentId;
    if (!targetId || targetId === extra.id) {
      const orphanKpis = await db.kpi.count({ where: { departmentId: extra.id } });
      const orphanUsers = await db.user.count({ where: { departmentId: extra.id } });
      if (orphanKpis === 0 && orphanUsers === 0) {
        await db.section.deleteMany({ where: { departmentId: extra.id } });
        await db.department.delete({ where: { id: extra.id } }).catch(() => undefined);
      }
      continue;
    }
    await db.kpi.updateMany({ where: { departmentId: extra.id }, data: { departmentId: targetId } });
    await db.user.updateMany({ where: { departmentId: extra.id }, data: { departmentId: targetId } });
    await db.knowledgeAsset
      .updateMany({ where: { departmentId: extra.id }, data: { departmentId: targetId } })
      .catch(() => undefined);
    await db.operationalGoal
      .updateMany({ where: { departmentId: extra.id }, data: { departmentId: targetId } })
      .catch(() => undefined);
    await db.section.deleteMany({ where: { departmentId: extra.id } });
    await db.department.delete({ where: { id: extra.id } }).catch(() => undefined);
  }
  await loadDepartments();
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

async function clearDemoMeasurements() {
  // مسح نتائج القياس التجريبية السابقة لهذا العام فقط
  await db.correctiveAction.deleteMany({
    where: { card: { year: YEAR } },
  });
  await db.deviationCard.deleteMany({ where: { year: YEAR } });
  await db.earlyWarningAlert.deleteMany({ where: { year: YEAR } });
  await db.evidence.deleteMany({
    where: {
      OR: [
        { measurementPeriod: { year: YEAR } },
        { entry: { year: YEAR } },
      ],
    },
  });
  await db.measurementPeriod.deleteMany({ where: { year: YEAR } });
  await db.kpiEntry.deleteMany({ where: { year: YEAR } });
  await db.kpiTarget.deleteMany({ where: { year: YEAR } });
}

async function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`ملف Excel غير موجود: ${EXCEL_PATH}`);
  }

  const buffer = fs.readFileSync(EXCEL_PATH);
  const defs = parseWorkbookDefs(buffer);
  console.log(`📄 تعريفات مؤشرات من Excel (بدون نتائج): ${defs.length}`);
  console.log("ℹ️  المستهدفات والفعلي والإنجاز = بيانات افتراضية للتجربة فقط");

  await loadDepartments();
  await mergeDuplicateDepartments();
  await clearDemoMeasurements();

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
    defsParsed: defs.length,
  };

  const strategicGoalIds = new Set<number>();
  const operationalGoalIds = new Set<number>();
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

  for (const def of defs) {
    const { departmentId, ownerLabel } = await upsertDepartment(def.ownerDeptRaw);
    counts.departments = deptByNorm.size;

    let strategicGoalId: number | undefined;
    let operationalGoalId: number | undefined;

    if (def.type === "STRATEGIC" && def.goalCode) {
      const code = def.goalCode.split("-")[0] || def.goalCode;
      strategicGoalId = await upsertStrategicGoal(code);
      strategicGoalIds.add(strategicGoalId);
    } else if (def.type === "OPERATIONAL" && def.goalCode) {
      const deptId = departmentId ?? firstDept.id;
      operationalGoalId = await upsertOperationalGoal(def.goalCode, deptId);
      operationalGoalIds.add(operationalGoalId);
    }

    // خط أساس ومستهدف سنوي افتراضيان (من Q1 كمرجع)
    const baseSynth = syntheticMetrics(def.code, def.unit, def.polarity, "Q1");

    const requirement = await db.measurementRequirement.upsert({
      where: { code: def.code },
      create: {
        code: def.code,
        name: def.name,
        unit: def.unit,
        polarity: def.polarity,
        frequency: def.frequency,
        requiredData: def.requiredData || null,
        departmentId,
        ownerId: null,
        active: true,
      },
      update: {
        name: def.name,
        unit: def.unit,
        polarity: def.polarity,
        frequency: def.frequency,
        requiredData: def.requiredData || null,
        departmentId,
        active: true,
      },
    });

    const kpi = await db.kpi.upsert({
      where: { code: def.code },
      create: {
        code: def.code,
        name: def.name,
        type: def.type,
        unit: def.unit,
        polarity: def.polarity,
        frequency: def.frequency,
        requiredData: def.requiredData || null,
        departmentId,
        ownerLabel,
        baseline: baseSynth.baseline,
        annualTarget: baseSynth.annualTarget,
        recommendation: "بيانات تجريبية — لا تمثّل نتائج القياس الرسمي",
        strategicGoalId,
        operationalGoalId,
        requirementId: requirement.id,
        active: true,
      },
      update: {
        name: def.name,
        type: def.type,
        unit: def.unit,
        polarity: def.polarity,
        frequency: def.frequency,
        requiredData: def.requiredData || null,
        departmentId,
        ownerLabel,
        baseline: baseSynth.baseline,
        annualTarget: baseSynth.annualTarget,
        recommendation: "بيانات تجريبية — لا تمثّل نتائج القياس الرسمي",
        strategicGoalId,
        operationalGoalId,
        requirementId: requirement.id,
        active: true,
      },
    });

    if (kpiCodesForEmployee.length < 5) kpiCodesForEmployee.push(kpi.id);

    await db.kpiTarget.upsert({
      where: { kpiId_year_period: { kpiId: kpi.id, year: YEAR, period: "Y" } },
      create: { kpiId: kpi.id, year: YEAR, period: "Y", targetValue: baseSynth.annualTarget },
      update: { targetValue: baseSynth.annualTarget },
    });
    counts.kpiTargets++;

    for (const period of DEMO_PERIODS) {
      const synth = syntheticMetrics(def.code, def.unit, def.polarity, period);

      await db.kpiTarget.upsert({
        where: { kpiId_year_period: { kpiId: kpi.id, year: YEAR, period } },
        create: { kpiId: kpi.id, year: YEAR, period, targetValue: synth.periodTarget },
        update: { targetValue: synth.periodTarget },
      });
      counts.kpiTargets++;

      await upsertMeasurementPeriod({
        requirementId: requirement.id,
        year: YEAR,
        period,
        actualValue: synth.actualValue,
        whatHappened: "تحليل تجريبي افتراضي — ليس من ملف Excel الرسمي",
        howHappened: "أُنشئ آلياً لبيئة التجربة في منصة مِقياس",
        enteredById: adminUserId,
        approvalStatus: "FINAL_APPROVED",
        approvedById: adminUserId,
        approvedAt: new Date(),
        initialApprovedById: adminUserId,
        initialApprovedAt: new Date(),
      });
      counts.kpiEntries++;
    }
  }

  counts.kpis = defs.length;
  counts.strategicGoals = strategicGoalIds.size;
  counts.operationalGoals = operationalGoalIds.size;

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
  const head = await db.user.findUnique({ where: { email: "head@zad.org.sa" } });
  const manager = await db.user.findUnique({ where: { email: "manager@zad.org.sa" } });

  async function assignOwned(
    userId: number,
    fillerRole: "EMPLOYEE" | "SECTION_HEAD" | "DEPT_MANAGER",
    kpiIds: number[]
  ) {
    if (kpiIds.length === 0) return;
    await db.kpi.updateMany({ where: { id: { in: kpiIds } }, data: { ownerId: userId } });
    const owned = await db.kpi.findMany({
      where: { id: { in: kpiIds } },
      select: { requirementId: true },
    });
    const reqIds = owned.map((k) => k.requirementId).filter((id): id is number => id != null);
    if (reqIds.length > 0) {
      await db.measurementRequirement.updateMany({
        where: { id: { in: reqIds } },
        data: { ownerId: userId, fillerRole },
      });
    }
  }

  if (employee) await assignOwned(employee.id, "EMPLOYEE", kpiCodesForEmployee.slice(0, 3));
  const moreKpis = await db.kpi.findMany({
    where: { active: true, id: { notIn: kpiCodesForEmployee.slice(0, 3) } },
    select: { id: true },
    take: 4,
    orderBy: { id: "asc" },
  });
  if (head) await assignOwned(head.id, "SECTION_HEAD", moreKpis.slice(0, 2).map((k) => k.id));
  if (manager) await assignOwned(manager.id, "DEPT_MANAGER", moreKpis.slice(2, 4).map((k) => k.id));

  const submittedSample = await db.measurementPeriod.findMany({
    where: { year: YEAR, approvalStatus: "FINAL_APPROVED" },
    take: 3,
    orderBy: { id: "asc" },
    select: { id: true, requirementId: true, year: true, period: true },
  });
  if (submittedSample.length > 0) {
    await db.measurementPeriod.updateMany({
      where: { id: { in: submittedSample.map((e) => e.id) } },
      data: {
        approvalStatus: "SUBMITTED",
        approvedAt: null,
        approvedById: null,
        initialApprovedAt: null,
        initialApprovedById: null,
      },
    });
    await db.kpiEntry.updateMany({
      where: {
        OR: submittedSample.map((mp) => ({
          kpi: { requirementId: mp.requirementId },
          year: mp.year,
          period: mp.period,
        })),
      },
      data: { approvalStatus: "SUBMITTED", approvedAt: null, approvedById: null },
    });
  }

  const initialSample = await db.measurementPeriod.findMany({
    where: { year: YEAR, approvalStatus: "FINAL_APPROVED" },
    take: 3,
    orderBy: { id: "desc" },
    select: { id: true, requirementId: true, year: true, period: true },
  });
  if (initialSample.length > 0) {
    await db.measurementPeriod.updateMany({
      where: { id: { in: initialSample.map((e) => e.id) } },
      data: {
        approvalStatus: "INITIAL_APPROVED",
        approvedAt: null,
        approvedById: null,
        initialApprovedAt: new Date(),
        initialApprovedById: manager?.id ?? adminUserId,
      },
    });
    await db.kpiEntry.updateMany({
      where: {
        OR: initialSample.map((mp) => ({
          kpi: { requirementId: mp.requirementId },
          year: mp.year,
          period: mp.period,
        })),
      },
      data: { approvalStatus: "INITIAL_APPROVED", approvedAt: null, approvedById: null },
    });
  }

  // بطاقات انحراف افتراضية للمؤشرات ذات إنجاز ضعيف
  const weak = await db.kpiEntry.findMany({
    where: {
      year: YEAR,
      period: "Q2",
      approvalStatus: "FINAL_APPROVED",
      achievementPct: { lt: 80 },
    },
    include: { kpi: { select: { polarity: true } } },
    take: 8,
    orderBy: { achievementPct: "asc" },
  });
  for (const e of weak) {
    const target = await db.kpiTarget.findUnique({
      where: { kpiId_year_period: { kpiId: e.kpiId, year: YEAR, period: "Q2" } },
    });
    if (!target) continue;
    await db.deviationCard.create({
      data: {
        kpiId: e.kpiId,
        year: YEAR,
        period: "Q2",
        targetValue: target.targetValue,
        actualValue: e.actualValue,
        deviationPct: e.achievementPct != null ? round2(100 - e.achievementPct) : 20,
        reasons: "بطاقة تجريبية افتراضية — بيئة تجربة",
        createdById: adminUserId,
      },
    });
  }

  console.log("\n═══════════════════════════════════════");
  console.log("✅ اكتملت بذرة التجربة (تعريف من Excel + قياسات افتراضية)");
  console.log("═══════════════════════════════════════");
  console.log(`  الإدارات:          ${counts.departments}`);
  console.log(`  أهداف استراتيجية:  ${counts.strategicGoals}`);
  console.log(`  أهداف تشغيلية:     ${counts.operationalGoals}`);
  console.log(`  مؤشرات (تعريف):    ${counts.kpis}`);
  console.log(`  مستهدفات افتراضية: ${counts.kpiTargets}`);
  console.log(`  إدخالات افتراضية:  ${counts.kpiEntries}`);
  console.log(`  مستخدمون تجريبيون: ${counts.users}`);
  console.log("  ⚠️  النتائج ليست من ملف القياس الرسمي");
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
