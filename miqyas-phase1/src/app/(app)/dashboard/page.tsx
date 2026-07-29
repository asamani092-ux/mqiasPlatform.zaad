import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { can } from "@/lib/rbac";
import { parseTrackParams } from "@/lib/track-params";
import { db } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";

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
      where: { year, period, approvalStatus: "APPROVED" },
      select: { status: true },
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

  return (
    <DashboardClient
      overview={overview}
      byStatus={byStatus}
      userName={user.name}
      departments={departments}
      canManageStructure={can.manageStructure(user) || can.manageUsers(user)}
    />
  );
}
