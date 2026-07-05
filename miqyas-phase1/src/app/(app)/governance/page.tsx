import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { governanceStats } from "@/lib/governance-scope";
import { parseTrackParams } from "@/lib/track-params";
import GovernanceClient from "@/components/GovernanceClient";

export const dynamic = "force-dynamic";

export default async function GovernancePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = parseTrackParams(searchParams);

  const [stats, requirements, observations] = await Promise.all([
    governanceStats(year, period),
    db.governanceRequirement.findMany({ where: { year }, orderBy: { id: "asc" } }),
    db.governanceObservation.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const serializedObs = observations.map((o) => ({
    ...o,
    closedAt: o.closedAt?.toISOString() ?? null,
  }));

  return (
    <GovernanceClient
      initialStats={stats}
      initialRequirements={requirements}
      initialObservations={serializedObs}
      year={year}
      period={period}
      canManage={can.manageGovernance(user)}
    />
  );
}
