import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getKpiRows } from "@/lib/analytics";
import { enrichOperationalRows } from "@/lib/operational-analytics";
import { parseTrackParams } from "@/lib/track-params";
import { db } from "@/lib/db";
import OperationalTrackClient from "@/components/OperationalTrackClient";

export const dynamic = "force-dynamic";

export default async function OperationalPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = parseTrackParams(searchParams);

  const [rows, departments] = await Promise.all([
    getKpiRows({ user, year, period, type: "OPERATIONAL" }),
    db.department.findMany({
      orderBy: { deptNo: "asc" },
      select: { id: true, name: true, deptNo: true },
    }),
  ]);

  return (
    <OperationalTrackClient
      rows={enrichOperationalRows(rows)}
      departments={departments}
      year={year}
      period={period}
    />
  );
}
