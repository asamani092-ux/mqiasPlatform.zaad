import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { scopedKpiWhere } from "@/lib/analytics";
import { parseTrackParams } from "@/lib/track-params";
import { summarizeDeviationCards } from "@/lib/deviation-stats";
import DeviationClient from "@/components/DeviationClient";

export const dynamic = "force-dynamic";

async function countLateActions(year: number, period: string, scope: ReturnType<typeof scopedKpiWhere>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return db.correctiveAction.count({
    where: {
      OR: [
        { status: "LATE" },
        { status: { in: ["PENDING", "IN_PROGRESS"] }, dueDate: { lt: today } },
      ],
      card: { year, period: period as "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "Y", kpi: scope },
    },
  });
}

export default async function DeviationPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = parseTrackParams(searchParams);
  const scope = scopedKpiWhere(user);

  const [cards, lateActions] = await Promise.all([
    db.deviationCard.findMany({
      where: { year, period, kpi: scope },
      include: {
        kpi: { select: { code: true, name: true, unit: true } },
        actions: { include: { responsible: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    countLateActions(year, period, scope),
  ]);

  const serialized = cards.map((c) => ({
    ...c,
    closedAt: c.closedAt?.toISOString() ?? null,
    actions: c.actions.map((a) => ({
      ...a,
      dueDate: a.dueDate.toISOString(),
      completedAt: a.completedAt?.toISOString() ?? null,
    })),
  }));

  const summary = summarizeDeviationCards(
    serialized.map((c) => ({ id: c.id, status: c.status, actions: c.actions })),
    lateActions,
  );

  return (
    <DeviationClient
      initialCards={serialized}
      initialSummary={summary}
      year={year}
      period={period}
      canManage={can.manageDeviation(user)}
      isAdmin={user.role === "SYSTEM_ADMIN"}
    />
  );
}
