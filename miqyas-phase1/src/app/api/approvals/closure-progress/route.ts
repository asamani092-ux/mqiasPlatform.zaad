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
  })
  .strict();

async function roundContext() {
  const year = parseInt(await getSetting("measurement_round_year"), 10) || new Date().getFullYear();
  const period = ((await getSetting("measurement_round_period")) || "Q1") as Period;
  return { year, period };
}

/**
 * تجميع متابعة الإغلاق لكل إدارة — O(d + k) زمنًا، O(d) مكانًا.
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
        departmentId: true,
        frequency: true,
        department: { select: { id: true, name: true } },
        periods: {
          where: { year, period },
          select: {
            id: true,
            approvalStatus: true,
            enteredById: true,
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
    };
    const byDept = new Map<number, Acc>();

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
        };
        byDept.set(req.departmentId, row);
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
    }

    const rows = Array.from(byDept.values()).sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName, "ar")
    );

    return NextResponse.json({ year, period, rows });
  } catch (e) {
    return handleApiError(e);
  }
}

/** تذكير مسؤولي المتطلبات المتبقية في إدارة — إشعار منصة + بريد */
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
          select: { id: true, approvalStatus: true },
          take: 1,
        },
      },
    });

    let notified = 0;
    for (const req of requirements) {
      const allowed = resolvePeriods(req.frequency);
      if (!allowed.includes(period)) continue;
      const mp = req.periods[0];
      if (mp && isFinalApproved(mp.approvalStatus)) continue;
      if (!req.ownerId) continue;

      const link = mp ? `/my?mp=${mp.id}` : `/my?year=${year}&period=${period}`;
      await notify({
        userIds: [req.ownerId],
        type: "SYSTEM",
        title: `تذكير إغلاق القياس — ${department.name}`,
        body: `${req.code} — ${req.name} بانتظار الاعتماد النهائي للجولة`,
        link,
        linkLabel: `فتح القياس ${req.code}`,
        email: true,
      });
      notified += 1;
    }

    await audit(parseInt(user.id, 10), "CLOSURE_REMIND", "Department", body.departmentId, {
      year,
      period,
      notified,
    });

    return NextResponse.json({ ok: true, notified, year, period });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}
