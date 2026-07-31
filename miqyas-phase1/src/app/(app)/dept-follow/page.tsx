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
  const departmentId =
    user.role === "SYSTEM_ADMIN" ? undefined : (user.departmentId ?? -1);

  const requirements = await db.measurementRequirement.findMany({
    where: {
      active: true,
      ...(departmentId != null ? { departmentId } : {}),
    },
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      requiredData: true,
      owner: { select: { id: true, name: true } },
      department: { select: { name: true } },
      kpis: {
        where: { active: true },
        select: { code: true, name: true, type: true },
      },
      periods: {
        where: { year, period },
        take: 1,
        select: {
          id: true,
          actualValue: true,
          whatHappened: true,
          howHappened: true,
          approvalStatus: true,
          rejectReason: true,
          enteredBy: { select: { id: true, name: true } },
          evidences: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              status: true,
              rejectReason: true,
            },
          },
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
      requiredData: r.requiredData,
      ownerName: r.owner?.name ?? "—",
      departmentName: r.department?.name ?? "—",
      kpiCodes: r.kpis.map((k) => k.code),
      kpiLabels: r.kpis.map((k) => `${k.code} — ${k.name}`),
      measurementPeriodId: mp?.id ?? null,
      actualValue: mp?.actualValue ?? null,
      whatHappened: mp?.whatHappened ?? null,
      howHappened: mp?.howHappened ?? null,
      approvalStatus: mp?.approvalStatus ?? null,
      rejectReason: mp?.rejectReason ?? null,
      enteredByName: mp?.enteredBy?.name ?? null,
      evidences: mp?.evidences ?? [],
      evidenceCount: mp?.evidences.length ?? 0,
    };
  });

  return <DeptFollowClient year={year} period={period} rows={rows} />;
}
