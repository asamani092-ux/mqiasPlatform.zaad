import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { scopedKpiWhere } from "@/lib/analytics";
import { parseTrackParams } from "@/lib/track-params";
import DeviationClient from "@/components/DeviationClient";

export const dynamic = "force-dynamic";

export default async function DeviationPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = parseTrackParams(searchParams);

  const cards = await db.deviationCard.findMany({
    where: { year, period, kpi: scopedKpiWhere(user) },
    include: {
      kpi: { select: { code: true, name: true, unit: true } },
      actions: { include: { responsible: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = cards.map((c) => ({
    ...c,
    closedAt: c.closedAt?.toISOString() ?? null,
    actions: c.actions.map((a) => ({
      ...a,
      dueDate: a.dueDate.toISOString(),
      completedAt: a.completedAt?.toISOString() ?? null,
    })),
  }));

  return (
    <DeviationClient
      initialCards={serialized}
      year={year}
      period={period}
      canManage={can.manageDeviation(user)}
      isAdmin={user.role === "SYSTEM_ADMIN"}
    />
  );
}
