import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { scopedKnowledgeWhere } from "@/lib/knowledge-scope";
import { parseTrackParams } from "@/lib/track-params";
import KnowledgeClient from "@/components/KnowledgeClient";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = await parseTrackParams(searchParams);
  const scope = scopedKnowledgeWhere(user);

  const [assets, departments, kpis] = await Promise.all([
    db.knowledgeAsset.findMany({
      where: { year, period, ...scope },
      include: {
        department: { select: { name: true } },
        kpi: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.department.findMany({
      orderBy: { deptNo: "asc" },
      select: { id: true, name: true },
    }),
    db.kpi.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const total = assets.length;
  const approved = assets.filter((a) => a.status === "ACTIVE").length;
  const used = assets.filter((a) => a.isUsed).length;
  const linkedToKpiCount = assets.filter((a) => a.kpiId != null).length;
  const draftCount = total - approved;
  const approvedPct = total > 0 ? Math.round((approved / total) * 1000) / 10 : 0;
  const usedPct = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;

  return (
    <KnowledgeClient
      initialStats={{ total, approvedPct, usedPct, linkedToKpiCount, approvedCount: approved, draftCount }}
      initialAssets={assets}
      departments={departments}
      kpis={kpis}
      year={year}
      period={period}
      canManage={can.manageKnowledge(user)}
    />
  );
}
