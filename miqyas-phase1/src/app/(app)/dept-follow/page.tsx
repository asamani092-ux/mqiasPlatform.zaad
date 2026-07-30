import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { parseTrackParams } from "@/lib/track-params";
import DeptFollowClient from "@/components/DeptFollowClient";

export const dynamic = "force-dynamic";

export default async function DeptFollowPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.followDepartment(user)) redirect("/my");

  const { year, period } = await parseTrackParams(searchParams);
  const departmentId = user.departmentId ?? -1;

  const requirements = await db.measurementRequirement.findMany({
    where: { departmentId, active: true },
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      owner: { select: { id: true, name: true } },
      periods: {
        where: { year, period },
        take: 1,
        select: {
          id: true,
          actualValue: true,
          approvalStatus: true,
          _count: { select: { evidences: true } },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  const rows = requirements.map((r) => {
    const mp = r.periods[0] ?? null;
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      unit: r.unit,
      ownerName: r.owner?.name ?? "—",
      actualValue: mp?.actualValue ?? null,
      approvalStatus: mp?.approvalStatus ?? null,
      evidenceCount: mp?._count.evidences ?? 0,
    };
  });

  return <DeptFollowClient year={year} period={period} rows={rows} />;
}
