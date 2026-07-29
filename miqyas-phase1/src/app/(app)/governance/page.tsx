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

  const [stats, requirements] = await Promise.all([
    governanceStats(year, period),
    db.governanceRequirement.findMany({ where: { year }, orderBy: { id: "asc" } }),
  ]);

  return (
    <GovernanceClient
      initialStats={stats}
      initialRequirements={requirements}
      year={year}
      period={period}
      canManage={can.manageGovernance(user)}
    />
  );
}
