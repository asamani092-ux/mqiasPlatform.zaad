import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.viewAuditOffice(user)) return jsonError("غير مصرح", 403);

    const [
      plansActive,
      engagementsOpen,
      findingsOpen,
      findingsHigh,
      findingsClosed,
      findingsTotal,
      actionsPending,
      reportsIssued,
    ] = await Promise.all([
      db.auditYearPlan.count({ where: { status: "ACTIVE" } }),
      db.auditEngagement.count({
        where: { status: { in: ["PLANNED", "IN_PROGRESS", "REPORTING"] } },
      }),
      db.auditFinding.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      db.auditFinding.count({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
          severity: { in: ["HIGH", "CRITICAL"] },
        },
      }),
      db.auditFinding.count({ where: { status: "CLOSED" } }),
      db.auditFinding.count(),
      db.auditCorrectiveAction.count({
        where: { status: { in: ["PENDING", "IN_PROGRESS", "LATE"] } },
      }),
      db.auditReport.count({ where: { status: "ISSUED" } }),
    ]);

    const closurePct =
      findingsTotal === 0 ? 0 : Math.round((findingsClosed / findingsTotal) * 100);

    return NextResponse.json({
      summary: {
        plansActive,
        engagementsOpen,
        findingsOpen,
        findingsHigh,
        findingsClosed,
        findingsTotal,
        closurePct,
        actionsPending,
        reportsIssued,
      },
      canManagePapers: can.manageAuditPapers(user),
      canManage: can.manageAuditPlan(user),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
