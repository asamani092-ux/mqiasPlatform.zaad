import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { getSetting } from "@/lib/settings";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { isFinalApproved } from "@/lib/approval-status";
import { resolvePeriods } from "@/lib/kpi";

export const dynamic = "force-dynamic";

const postSchema = z
  .object({
    departmentId: z.number().int().positive(),
    mode: z.enum(["closure", "missing_evidence"]).default("closure"),
  })
  .strict();

async function roundContext() {
  const year = parseInt(await getSetting("measurement_round_year"), 10) || new Date().getFullYear();
  const period = ((await getSetting("measurement_round_period")) || "Q1") as Period;
  return { year, period };
}

type OwnerGap = {
  ownerId: number;
  ownerName: string;
  count: number;
  codes: string[];
};

/**
 * تجميع متابعة الإغلاق + فجوات الشواهد لكل إدارة.
 * زمن: O(R) · مكان: O(D + O_owners)
 */
export async function GET() {
  try {
    const user = await requireUser();
    if (!can.finalApprove(user)) return jsonError("غير مصرح", 403);

    const { year, period } = await roundContext();

    const requirements = await db.measurementRequirement.findMany({
      where: { active: true, departmentId: { not: null } },
      select: {
        id: true,
        code: true,
        departmentId: true,
        frequency: true,
        ownerId: true,
        owner: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        periods: {
          where: { year, period },
          select: {
            id: true,
            approvalStatus: true,
            evidences: {
              where: { status: "ACTIVE" },
              select: { id: true },
              take: 1,
            },
          },
          take: 1,
        },
      },
    });

    type Acc = {
      departmentId: number;
      departmentName: string;
      total: number;
      finalApproved: number;
      remaining: number;
      partial: number;
      missingEvidence: number;
      ownersMissingEvidence: OwnerGap[];
    };
    const byDept = new Map<number, Acc>();
    const ownerAcc = new Map<number, Map<number, OwnerGap>>();

    for (const req of requirements) {
      if (req.departmentId == null || !req.department) continue;
      const allowed = resolvePeriods(req.frequency);
      if (!allowed.includes(period)) continue;

      let row = byDept.get(req.departmentId);
      if (!row) {
        row = {
          departmentId: req.departmentId,
          departmentName: req.department.name,
          total: 0,
          finalApproved: 0,
          remaining: 0,
          partial: 0,
          missingEvidence: 0,
          ownersMissingEvidence: [],
        };
        byDept.set(req.departmentId, row);
        ownerAcc.set(req.departmentId, new Map());
      }
      row.total += 1;
      const mp = req.periods[0];
      if (mp && isFinalApproved(mp.approvalStatus)) {
        row.finalApproved += 1;
      } else {
        row.remaining += 1;
        if (
          mp &&
          (mp.approvalStatus === "SUBMITTED" ||
            mp.approvalStatus === "PENDING" ||
            mp.approvalStatus === "INITIAL_APPROVED")
        ) {
          row.partial += 1;
        }
      }

      const hasActiveEvidence = Boolean(mp?.evidences?.length);
      if (!hasActiveEvidence) {
        row.missingEvidence += 1;
        if (req.ownerId && req.owner) {
          const om = ownerAcc.get(req.departmentId)!;
          let gap = om.get(req.ownerId);
          if (!gap) {
            gap = {
              ownerId: req.ownerId,
              ownerName: req.owner.name,
              count: 0,
              codes: [],
            };
            om.set(req.ownerId, gap);
          }
          gap.count += 1;
          if (gap.codes.length < 8) gap.codes.push(req.code);
        }
      }
    }

    const rows = Array.from(byDept.values())
      .map((row) => ({
        ...row,
        ownersMissingEvidence: Array.from(ownerAcc.get(row.departmentId)?.values() ?? []).sort(
          (a, b) => b.count - a.count || a.ownerName.localeCompare(b.ownerName, "ar"),
        ),
      }))
      .sort((a, b) => a.departmentName.localeCompare(b.departmentName, "ar"));

    const totals = rows.reduce(
      (acc, r) => {
        acc.total += r.total;
        acc.remaining += r.remaining;
        acc.missingEvidence += r.missingEvidence;
        return acc;
      },
      { total: 0, remaining: 0, missingEvidence: 0 },
    );

    return NextResponse.json({ year, period, rows, totals });
  } catch (e) {
    return handleApiError(e);
  }
}

/** تذكير مسؤولي المتطلبات — إغلاق أو فجوة شواهد */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.finalApprove(user)) return jsonError("غير مصرح", 403);

    const body = postSchema.parse(await req.json());
    const { year, period } = await roundContext();

    const department = await db.department.findUnique({
      where: { id: body.departmentId },
      select: { id: true, name: true },
    });
    if (!department) return jsonError("الإدارة غير موجودة", 404);

    const requirements = await db.measurementRequirement.findMany({
      where: { active: true, departmentId: body.departmentId },
      select: {
        id: true,
        code: true,
        name: true,
        ownerId: true,
        frequency: true,
        owner: { select: { id: true, name: true } },
        periods: {
          where: { year, period },
          select: {
            id: true,
            approvalStatus: true,
            evidences: {
              where: { status: "ACTIVE" },
              select: { id: true },
              take: 1,
            },
          },
          take: 1,
        },
      },
    });

    let notified = 0;
    for (const req of requirements) {
      const allowed = resolvePeriods(req.frequency);
      if (!allowed.includes(period)) continue;
      if (!req.ownerId) continue;

      const mp = req.periods[0];
      if (body.mode === "closure") {
        if (mp && isFinalApproved(mp.approvalStatus)) continue;
      } else {
        const hasActiveEvidence = Boolean(mp?.evidences?.length);
        if (hasActiveEvidence) continue;
      }

      const link = mp ? `/my?mp=${mp.id}` : `/my?year=${year}&period=${period}`;
      const isEvidence = body.mode === "missing_evidence";
      await notify({
        userIds: [req.ownerId],
        type: "SYSTEM",
        title: isEvidence
          ? `تذكير رفع الشواهد — ${department.name}`
          : `تذكير إغلاق القياس — ${department.name}`,
        body: isEvidence
          ? `${req.code} — ${req.name}: لم يُرفع شاهد نشط لهذه الدورة`
          : `${req.code} — ${req.name} بانتظار الاعتماد النهائي للجولة`,
        link,
        linkLabel: `فتح القياس ${req.code}`,
        email: true,
      });
      notified += 1;
    }

    await audit(
      parseInt(user.id, 10),
      body.mode === "missing_evidence" ? "EVIDENCE_REMIND" : "CLOSURE_REMIND",
      "Department",
      body.departmentId,
      { year, period, notified, mode: body.mode },
    );

    return NextResponse.json({ ok: true, notified, year, period, mode: body.mode });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}
