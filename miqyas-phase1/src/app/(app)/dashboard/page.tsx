import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { can } from "@/lib/rbac";
import { parseTrackParams } from "@/lib/track-params";
import { db } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";
import { FINAL_APPROVED_STATUSES } from "@/lib/approval-status";
import { achievementPct, deviationPct } from "@/lib/kpi";
import type { KpiStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = await parseTrackParams(searchParams);

  const [overview, entries, departments] = await Promise.all([
    getDashboardOverview(user, year, period),
    db.kpiEntry.findMany({
      where: { year, period, approvalStatus: { in: [...FINAL_APPROVED_STATUSES] } },
      select: {
        kpiId: true,
        status: true,
        actualValue: true,
        achievementPct: true,
        kpi: {
          select: {
            code: true,
            name: true,
            ownerLabel: true,
            polarity: true,
            department: { select: { name: true } },
            targets: {
              where: { year, period },
              select: { targetValue: true },
              take: 1,
            },
          },
        },
      },
    }),
    db.department.findMany({
      where: { deptNo: { lte: 6 } },
      orderBy: { deptNo: "asc" },
      select: {
        id: true,
        deptNo: true,
        name: true,
        color: true,
        sections: {
          orderBy: { sectionNo: "asc" },
          select: { id: true, sectionNo: true, name: true, code: true },
        },
      },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const e of entries) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  const deviationKpis = entries
    .filter((e) => e.status === "AT_RISK" || e.status === "CRITICAL")
    .map((e) => {
      const target = e.kpi.targets[0]?.targetValue ?? null;
      const pct =
        target != null
          ? achievementPct(e.actualValue, target, e.kpi.polarity) ?? e.achievementPct
          : e.achievementPct;

      return {
        kpiId: e.kpiId,
        code: e.kpi.code,
        name: e.kpi.name,
        ownerLabel: e.kpi.ownerLabel,
        departmentName: e.kpi.department?.name ?? null,
        target,
        actual: e.actualValue,
        achievementPct: pct,
        deviationPct: deviationPct(pct),
        status: e.status as KpiStatus,
      };
    })
    .sort((a, b) => {
      const severity = (status: KpiStatus) => (status === "CRITICAL" ? 0 : 1);
      return severity(a.status) - severity(b.status) || (b.deviationPct ?? 0) - (a.deviationPct ?? 0);
    });

  return (
    <DashboardClient
      overview={overview}
      byStatus={byStatus}
      deviationKpis={deviationKpis}
      userName={user.name}
      departments={departments}
      canManageStructure={can.manageStructure(user) || can.manageUsers(user)}
    />
  );
}
