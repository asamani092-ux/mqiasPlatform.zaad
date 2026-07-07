import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { previousPeriod, scopedKnowledgeWhere } from "@/lib/knowledge-scope";
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
  const { year, period } = parseTrackParams(searchParams);
  const scope = scopedKnowledgeWhere(user);

  const assets = await db.knowledgeAsset.findMany({
    where: { year, period, ...scope },
    include: { department: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const total = assets.length;
  const approved = assets.filter((a) => a.status === "APPROVED").length;
  const used = assets.filter((a) => a.isUsed).length;
  const draftCount = total - approved;
  const approvedPct = total > 0 ? Math.round((approved / total) * 1000) / 10 : 0;
  const usedPct = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;

  const prev = previousPeriod(year, period);
  const prevCount = await db.knowledgeAsset.count({
    where: { year: prev.year, period: prev.period, ...scope },
  });
  const growthPct =
    prevCount > 0
      ? Math.round(((total - prevCount) / prevCount) * 1000) / 10
      : total > 0
        ? 100
        : 0;

  return (
    <KnowledgeClient
      initialStats={{ total, approvedPct, usedPct, growthPct, approvedCount: approved, draftCount }}
      initialAssets={assets}
      year={year}
      period={period}
      canManage={can.manageKnowledge(user)}
    />
  );
}
