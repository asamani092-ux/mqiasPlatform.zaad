import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { currentQuarter } from "@/lib/kpi";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { db } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = currentQuarter();

  const [overview, entries] = await Promise.all([
    getDashboardOverview(user, year, period),
    db.kpiEntry.findMany({
      where: { year, period, approvalStatus: "APPROVED" },
      select: { status: true },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const e of entries) byStatus[e.status] = (byStatus[e.status] || 0) + 1;

  return (
    <DashboardClient
      overview={overview}
      byStatus={byStatus}
      userName={user.name}
    />
  );
}
