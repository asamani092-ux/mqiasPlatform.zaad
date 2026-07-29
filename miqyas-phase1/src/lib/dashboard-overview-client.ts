import type { Period } from "@prisma/client";
import { status5FromAveragePct, type Status5 } from "@/lib/status5";

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

function roundTrackPct(pct: number | null): number {
  return pct != null ? Math.round(pct * 10) / 10 : 0;
}

/** Time O(1), Space O(1) */
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

export { roundTrackPct };
