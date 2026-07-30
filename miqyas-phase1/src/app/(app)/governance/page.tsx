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
  const { year, period } = await parseTrackParams(searchParams);

  const [stats, requirements, observations] = await Promise.all([
    governanceStats(year, period),
    db.governanceRequirement.findMany({ where: { year }, orderBy: { id: "asc" } }),
    db.governanceObservation.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const serializedObservations = observations.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    closedAt: o.closedAt?.toISOString() ?? null,
  }));

  return (
    <GovernanceClient
      initialStats={stats}
      initialRequirements={requirements}
      initialObservations={serializedObservations}
      year={year}
      period={period}
      canManage={can.manageGovernance(user)}
    />
  );
}
