import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.viewCommittee(user)) return jsonError("غير مصرح", 403);

    const [findingsOpen, findingsHigh, findingsClosed, findingsTotal, actionsOpen, actionsDone, plansActive, reportsIssued, reportsDraft, decisionsOpen, decisionsDone, uploadsPending] =
      await Promise.all([
        db.auditFinding.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
        db.auditFinding.count({
          where: { status: { in: ["OPEN", "IN_PROGRESS"] }, severity: { in: ["HIGH", "CRITICAL"] } },
        }),
        db.auditFinding.count({ where: { status: "CLOSED" } }),
        db.auditFinding.count(),
        db.auditCorrectiveAction.count({ where: { status: { in: ["PENDING", "IN_PROGRESS", "LATE"] } } }),
        db.auditCorrectiveAction.count({ where: { status: "DONE" } }),
        db.auditYearPlan.count({ where: { status: "ACTIVE" } }),
        db.auditReport.count({ where: { status: "ISSUED" } }),
        db.auditReport.count({ where: { status: "DRAFT" } }),
        db.committeeDecision.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
        db.committeeDecision.count({ where: { status: "DONE" } }),
        db.externalAuditUpload.count({ where: { status: "PENDING_REVIEW" } }),
      ]);

    const closurePct = findingsTotal === 0 ? 0 : Math.round((findingsClosed / findingsTotal) * 100);
    const actionTotal = actionsOpen + actionsDone;
    const actionPct = actionTotal === 0 ? 0 : Math.round((actionsDone / actionTotal) * 100);
    const planBase = plansActive > 0 ? plansActive : 1;
    const planPct = Math.min(100, Math.round((reportsIssued / planBase) * 100));

    const topRisks = await db.auditFinding.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, severity: { in: ["HIGH", "CRITICAL"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, severity: true, status: true },
    });

    return NextResponse.json({
      summary: {
        findingsOpen,
        findingsHigh,
        findingsClosed,
        closurePct,
        actionPct,
        planPct,
        reportsIssued,
        reportsPending: reportsDraft,
        decisionsOpen,
        decisionsDone,
        uploadsPending,
      },
      topRisks,
      canManage: can.manageCommittee(user),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
