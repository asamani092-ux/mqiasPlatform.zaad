import type { Period } from "@prisma/client";
import { db } from "@/lib/db";
import { deviationPct } from "@/lib/kpi";
import type { KpiStatus } from "@/lib/types";

export type DeviatedKpi = {
  kpiId: number;
  code: string;
  name: string;
  ownerLabel: string | null;
  departmentName: string | null;
  target: number;
  actual: number;
  achievementPct: number | null;
  deviationPct: number | null;
  status: KpiStatus;
};

export type OpenDeviationCard = {
  id: number;
  kpiId: number;
  kpiName: string;
  period: Period;
  deviationPct: number;
  reasons: string;
  status: string;
  openActions: number;
  oldestDueDate: string | null;
};

export type LateAction = {
  id: number;
  cardId: number;
  description: string;
  responsible: string;
  dueDate: string;
  daysLate: number;
  kpiName: string;
  status: string;
};

export type ExecutiveSnapshot = {
  deviatedKpis: DeviatedKpi[];
  openDeviationCards: OpenDeviationCard[];
  lateActions: LateAction[];
  activeAlerts: { HIGH: number; MEDIUM: number; LOW: number };
  headline: {
    totalKpis: number;
    measuredKpis: number;
    pctCritical: number;
    pctAtRisk: number;
    openCards: number;
    lateActions: number;
  };
};

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export async function getExecutiveSnapshot(opts: {
  year: number;
  period: Period;
}): Promise<ExecutiveSnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = await db.kpiEntry.findMany({
    where: {
      year: opts.year,
      period: opts.period,
      approvalStatus: "APPROVED",
    },
    include: {
      kpi: {
        include: {
          department: { select: { name: true } },
          targets: { where: { year: opts.year, period: opts.period }, take: 1 },
        },
      },
    },
  });

  const totalKpis = await db.kpi.count({ where: { active: true } });
  const measuredKpis = entries.length;
  let criticalCount = 0;
  let atRiskCount = 0;

  const deviatedKpis: DeviatedKpi[] = [];

  for (const entry of entries) {
    if (entry.status === "CRITICAL") criticalCount++;
    if (entry.status === "AT_RISK") atRiskCount++;

    if (entry.status !== "AT_RISK" && entry.status !== "CRITICAL") continue;

    const target = entry.kpi.targets[0]?.targetValue ?? 0;
    deviatedKpis.push({
      kpiId: entry.kpiId,
      code: entry.kpi.code,
      name: entry.kpi.name,
      ownerLabel: entry.kpi.ownerLabel,
      departmentName: entry.kpi.department?.name ?? null,
      target,
      actual: entry.actualValue,
      achievementPct: entry.achievementPct,
      deviationPct: deviationPct(entry.achievementPct),
      status: entry.status as KpiStatus,
    });
  }

  deviatedKpis.sort((a, b) => (b.deviationPct ?? 0) - (a.deviationPct ?? 0));

  const cards = await db.deviationCard.findMany({
    where: {
      year: opts.year,
      period: opts.period,
      status: { not: "CLOSED" },
    },
    include: {
      kpi: { select: { id: true, name: true } },
      actions: {
        where: { status: { not: "DONE" } },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { deviationPct: "desc" },
  });

  const openDeviationCards: OpenDeviationCard[] = cards.map((c) => ({
    id: c.id,
    kpiId: c.kpiId,
    kpiName: c.kpi.name,
    period: c.period,
    deviationPct: c.deviationPct,
    reasons: c.reasons,
    status: c.status,
    openActions: c.actions.length,
    oldestDueDate: c.actions[0]?.dueDate.toISOString() ?? null,
  }));

  const rawLate = await db.correctiveAction.findMany({
    where: {
      OR: [
        { status: "LATE" },
        { status: { in: ["PENDING", "IN_PROGRESS"] }, dueDate: { lt: today } },
      ],
      card: { year: opts.year, period: opts.period },
    },
    include: {
      responsible: { select: { name: true } },
      card: { include: { kpi: { select: { name: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  const lateActions: LateAction[] = rawLate.map((a) => ({
    id: a.id,
    cardId: a.deviationCardId,
    description: a.description,
    responsible: a.responsible?.name || a.responsibleName || "—",
    dueDate: a.dueDate.toISOString(),
    daysLate: daysBetween(a.dueDate, today),
    kpiName: a.card.kpi.name,
    status: a.status,
  }));

  const alerts = await db.earlyWarningAlert.groupBy({
    by: ["riskLevel"],
    where: { year: opts.year, period: opts.period },
    _count: { id: true },
  });

  const activeAlerts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const row of alerts) {
    activeAlerts[row.riskLevel as keyof typeof activeAlerts] = row._count.id;
  }

  return {
    deviatedKpis,
    openDeviationCards,
    lateActions,
    activeAlerts,
    headline: {
      totalKpis,
      measuredKpis,
      pctCritical: totalKpis > 0 ? Math.round((criticalCount / totalKpis) * 1000) / 10 : 0,
      pctAtRisk: totalKpis > 0 ? Math.round((atRiskCount / totalKpis) * 1000) / 10 : 0,
      openCards: openDeviationCards.length,
      lateActions: lateActions.length,
    },
  };
}
