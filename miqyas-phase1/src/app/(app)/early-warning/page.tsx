import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopedKpiWhere } from "@/lib/analytics";
import { parseTrackParams } from "@/lib/track-params";
import { getSetting } from "@/lib/settings";
import {
  RISK_LABEL,
  sortAlertsByRisk,
  summarizeEarlyWarning,
  type EarlyWarningRow,
} from "@/lib/early-warning-stats";
import EarlyWarningClient from "@/components/EarlyWarningClient";

export const dynamic = "force-dynamic";

export default async function EarlyWarningPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = parseTrackParams(searchParams);

  const [alerts, gapThresholdPct] = await Promise.all([
    db.earlyWarningAlert.findMany({
      where: {
        year,
        period,
        kpi: scopedKpiWhere(user),
      },
      include: { kpi: { select: { id: true, code: true, name: true } } },
    }),
    getSetting("early_warning_gap_pct"),
  ]);

  const rows: EarlyWarningRow[] = sortAlertsByRisk(
    alerts.map((a) => ({
      id: a.id,
      kpiId: a.kpiId,
      kpiCode: a.kpi.code,
      kpiName: a.kpi.name,
      actualToDate: a.actualToDate,
      expectedToDate: a.expectedToDate,
      gapPct: a.gapPct,
      riskLevel: a.riskLevel,
      riskLabel: RISK_LABEL[a.riskLevel] || a.riskLevel,
      recipients: a.recipients,
      emailSent: a.emailSent,
      createdAt: a.createdAt.toISOString(),
    })),
  );

  const baseSummary = summarizeEarlyWarning(rows);

  return (
    <EarlyWarningClient
      rows={rows}
      summary={{ ...baseSummary, gapThresholdPct: gapThresholdPct || "20" }}
      year={year}
      period={period}
    />
  );
}
