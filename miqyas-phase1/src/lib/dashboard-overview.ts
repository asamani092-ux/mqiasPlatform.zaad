import type { Period } from "@prisma/client";
import { getKpiRows } from "@/lib/analytics";
import { governanceStats } from "@/lib/governance-scope";
import { averageAchievementPct, status5FromAveragePct, type Status5 } from "@/lib/status5";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac";
import { scopedKnowledgeWhere } from "@/lib/knowledge-scope";

export type DashboardOverview = {
  year: number;
  period: Period;
  strategicPct: number | null;
  operationalPct: number | null;
  governancePct: number;
  knowledgePct: number;
  earlyWarningCount: number;
  approvedEntriesCount: number;
  activeKpiCount: number;
  overallPct: number | null;
  donutSegments: { name: string; value: number; key: string }[];
};

export type TrackBarItem = {
  name: string;
  value: number;
  status5: Status5;
  key: string;
};

/** Big O: O(1) time, O(1) space */
export function trackBarData(overview: DashboardOverview): TrackBarItem[] {
  return [
    {
      name: "الأداء الاستراتيجي",
      value: roundTrackPct(overview.strategicPct),
      status5: status5FromAveragePct(overview.strategicPct),
      key: "strategic",
    },
    {
      name: "الأداء التشغيلي",
      value: roundTrackPct(overview.operationalPct),
      status5: status5FromAveragePct(overview.operationalPct),
      key: "operational",
    },
    {
      name: "مسار الحوكمة",
      value: overview.governancePct,
      status5: status5FromAveragePct(overview.governancePct),
      key: "governance",
    },
    {
      name: "المعرفة المؤسسية",
      value: overview.knowledgePct,
      status5: status5FromAveragePct(overview.knowledgePct),
      key: "knowledge",
    },
  ];
}

function roundTrackPct(pct: number | null): number {
  return pct != null ? Math.round(pct * 10) / 10 : 0;
}

/** Big O: O(n) time across queries, O(n) space */
export async function getDashboardOverview(
  user: SessionUser,
  year: number,
  period: Period,
): Promise<DashboardOverview> {
  const [strategicRows, operationalRows, gov, knowledgeAssets, earlyWarningCount, approvedEntriesCount, activeKpiCount] =
    await Promise.all([
      getKpiRows({ user, year, period, type: "STRATEGIC" }),
      getKpiRows({ user, year, period, type: "OPERATIONAL" }),
      governanceStats(year, period),
      db.knowledgeAsset.findMany({
        where: { year, period, ...scopedKnowledgeWhere(user) },
        select: { status: true },
      }),
      db.earlyWarningAlert.count({ where: { year, period } }),
      db.kpiEntry.count({ where: { year, period, approvalStatus: "APPROVED" } }),
      db.kpi.count({ where: { active: true } }),
    ]);

  const strategicPct = averageAchievementPct(strategicRows);
  const operationalPct = averageAchievementPct(operationalRows);
  const governancePct = gov.compliancePct;
  const knowledgeTotal = knowledgeAssets.length;
  const knowledgeApproved = knowledgeAssets.filter((a) => a.status === "APPROVED").length;
  const knowledgePct =
    knowledgeTotal > 0 ? Math.round((knowledgeApproved / knowledgeTotal) * 1000) / 10 : 0;

  const trackValues = [
    roundTrackPct(strategicPct),
    roundTrackPct(operationalPct),
    governancePct,
    knowledgePct,
  ];
  const measuredTracks = trackValues.filter((v) => v > 0);
  const overallPct =
    measuredTracks.length > 0
      ? Math.round((measuredTracks.reduce((s, v) => s + v, 0) / measuredTracks.length) * 10) / 10
      : null;

  const donutSegments = [
    { name: "الأداء الاستراتيجي", value: roundTrackPct(strategicPct), key: "strategic" },
    { name: "الأداء التشغيلي", value: roundTrackPct(operationalPct), key: "operational" },
    { name: "مسار الحوكمة", value: governancePct, key: "governance" },
    { name: "المعرفة المؤسسية", value: knowledgePct, key: "knowledge" },
  ].filter((s) => s.value > 0);

  return {
    year,
    period,
    strategicPct,
    operationalPct,
    governancePct,
    knowledgePct,
    earlyWarningCount,
    approvedEntriesCount,
    activeKpiCount,
    overallPct,
    donutSegments,
  };
}
