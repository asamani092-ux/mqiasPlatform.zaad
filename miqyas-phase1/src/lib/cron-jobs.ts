import type { Period, RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { achievementPct, currentQuarter } from "@/lib/kpi";
import { getSetting } from "@/lib/settings";
import { notify } from "@/lib/notify";

function quarterStart(year: number, period: Period): Date {
  const map: Record<string, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9, H1: 0, H2: 6, Y: 0 };
  return new Date(year, map[period] ?? 0, 1);
}

function quarterEnd(year: number, period: Period): Date {
  const map: Record<string, number> = { Q1: 2, Q2: 5, Q3: 8, Q4: 11, H1: 5, H2: 11, Y: 11 };
  const m = map[period] ?? 2;
  return new Date(year, m + 1, 0, 23, 59, 59, 999);
}

/** يُفعّل من بداية الشهر الثالث من كل ربع (مارس/يونيو/سبتمبر/ديسمبر) */
export function isEarlyWarningWindow(date = new Date()): boolean {
  const month = date.getMonth() + 1;
  return month % 3 === 0;
}

export function timeProgressInQuarter(date: Date, year: number, period: Period): number {
  const start = quarterStart(year, period).getTime();
  const end = quarterEnd(year, period).getTime();
  const now = date.getTime();
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

function riskFromGap(gap: number): RiskLevel {
  if (gap >= 40) return "HIGH";
  if (gap >= 30) return "MEDIUM";
  return "LOW";
}

async function resolveAlertRecipients(kpi: {
  departmentId: number | null;
  sectionId: number | null;
  ownerId: number | null;
}): Promise<{ userIds: number[]; emails: string[] }> {
  const userIds = new Set<number>();
  const emails = new Set<string>();

  if (kpi.ownerId) userIds.add(kpi.ownerId);

  if (kpi.departmentId) {
    const managers = await db.user.findMany({
      where: { role: "DEPT_MANAGER", departmentId: kpi.departmentId, status: "ACTIVE" },
      select: { id: true, email: true },
    });
    for (const u of managers) {
      userIds.add(u.id);
      emails.add(u.email);
    }
  }

  if (kpi.sectionId) {
    const heads = await db.user.findMany({
      where: { role: "SECTION_HEAD", sectionId: kpi.sectionId, status: "ACTIVE" },
      select: { id: true, email: true },
    });
    for (const u of heads) {
      userIds.add(u.id);
      emails.add(u.email);
    }
  }

  if (kpi.ownerId) {
    const owner = await db.user.findUnique({ where: { id: kpi.ownerId }, select: { email: true } });
    if (owner) emails.add(owner.email);
  }

  const allUsers = await db.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { email: true },
  });
  for (const u of allUsers) emails.add(u.email);

  return { userIds: Array.from(userIds), emails: Array.from(emails) };
}

export async function runEarlyWarning(date = new Date()) {
  if (!isEarlyWarningWindow(date)) {
    return { skipped: true, reason: "خارج نافذة الشهر الثالث من الربع", created: 0 };
  }

  const { year, period } = currentQuarter(date);
  if (!["Q1", "Q2", "Q3", "Q4"].includes(period)) {
    return { skipped: true, reason: "الإنذار المبكر للأرباع فقط", created: 0 };
  }

  const gapThreshold = parseFloat((await getSetting("early_warning_gap_pct")) || "20");
  const progress = timeProgressInQuarter(date, year, period);
  const sevenDaysAgo = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);

  const kpis = await db.kpi.findMany({
    where: { active: true, frequency: "QUARTERLY" },
    include: {
      targets: { where: { year, period }, take: 1 },
      entries: {
        where: { year, period, approvalStatus: "APPROVED" },
        take: 1,
      },
    },
  });

  let created = 0;

  for (const kpi of kpis) {
    const target = kpi.targets[0]?.targetValue;
    const entry = kpi.entries[0];
    if (target == null || !entry) continue;

    const expectedToDate = Math.round(target * progress * 100) / 100;
    const ach = achievementPct(entry.actualValue, expectedToDate, kpi.polarity);
    if (ach == null) continue;

    const gapPct = Math.round((100 - ach) * 10) / 10;
    if (gapPct < gapThreshold) continue;

    const recent = await db.earlyWarningAlert.findFirst({
      where: {
        kpiId: kpi.id,
        year,
        period,
        createdAt: { gte: sevenDaysAgo },
      },
    });
    if (recent) continue;

    const riskLevel = riskFromGap(gapPct);
    const { userIds, emails } = await resolveAlertRecipients(kpi);
    const message = `فجوة ${gapPct}% — المتحقق ${entry.actualValue} مقابل المتوقع ${expectedToDate}`;

    const alert = await db.earlyWarningAlert.create({
      data: {
        kpiId: kpi.id,
        year,
        period,
        expectedToDate,
        actualToDate: entry.actualValue,
        gapPct,
        riskLevel,
        message,
        recipients: emails.join(", "),
        emailSent: false,
      },
    });

    if (userIds.length > 0) {
      await notify({
        userIds,
        type: "EARLY_WARNING",
        title: `إنذار مبكر — ${kpi.name}`,
        body: message,
        link: "/early-warning",
        email: true,
      });
      await db.earlyWarningAlert.update({
        where: { id: alert.id },
        data: { emailSent: true },
      });
    }

    created++;
  }

  return { skipped: false, created, year, period };
}

export async function escalateLateActions(date = new Date()) {
  const escalationDays = parseInt((await getSetting("action_escalation_days")) || "0", 10);
  const cutoff = new Date(date);
  cutoff.setDate(cutoff.getDate() - escalationDays);
  cutoff.setHours(23, 59, 59, 999);

  const actions = await db.correctiveAction.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      escalatedAt: null,
      dueDate: { lt: cutoff },
    },
    include: {
      card: { include: { kpi: { select: { name: true } } } },
      responsible: { select: { id: true, email: true, name: true } },
    },
  });

  const admins = await db.user.findMany({
    where: { role: "SYSTEM_ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  const adminIds = admins.map((a) => a.id);

  let escalated = 0;

  for (const action of actions) {
    await db.correctiveAction.update({
      where: { id: action.id },
      data: { status: "LATE", escalatedAt: date },
    });

    const userIds = [...adminIds];
    if (action.responsibleId) userIds.push(action.responsibleId);

    await notify({
      userIds: Array.from(new Set(userIds)),
      type: "ACTION_LATE",
      title: `إجراء متأخر — ${action.card.kpi.name}`,
      body: `${action.description} — كان مستحقًا ${action.dueDate.toLocaleDateString("ar-SA")}`,
      link: "/deviation",
      email: true,
    });

    escalated++;
  }

  return { escalated };
}
