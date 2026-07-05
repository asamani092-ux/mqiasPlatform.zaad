import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopedKpiWhere } from "@/lib/analytics";
import { parseTrackParams } from "@/lib/track-params";
import EarlyWarningClient from "@/components/EarlyWarningClient";

export const dynamic = "force-dynamic";

const RISK_LABEL: Record<string, string> = { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" };

export default async function EarlyWarningPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = parseTrackParams(searchParams);

  const alerts = await db.earlyWarningAlert.findMany({
    where: {
      year,
      period,
      kpi: scopedKpiWhere(user),
    },
    include: { kpi: { select: { code: true, name: true } } },
    orderBy: [{ riskLevel: "desc" }, { createdAt: "desc" }],
  });

  const rows = alerts.map((a) => ({
    id: a.id,
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
  }));

  return <EarlyWarningClient rows={rows} year={year} period={period} />;
}
