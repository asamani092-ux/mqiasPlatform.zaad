import type { Period, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { resolvePeriods } from "@/lib/kpi";
import { roleToFillerRole } from "@/lib/approval-status";

export type MyRequirementsScope = {
  userId: number;
  role?: Role;
  departmentId?: number | null;
  sectionId?: number | null;
};

/** متطلبات القياس المسندة للمستخدم ضمن إدارته/قسمه فقط */
export async function getMyRequirements(
  userIdOrScope: number | MyRequirementsScope,
  year: number,
  period: Period,
  roleArg?: Role
) {
  const scope: MyRequirementsScope =
    typeof userIdOrScope === "number"
      ? { userId: userIdOrScope, role: roleArg }
      : userIdOrScope;

  const { userId, role, departmentId, sectionId } = scope;
  const fillerRole = role ? roleToFillerRole(role) : null;
  const where: Record<string, unknown> = { active: true, ownerId: userId };
  if (fillerRole) where.fillerRole = fillerRole;

  // منع ظهور متطلبات إدارة أخرى بسبب إسناد قديم عالق
  if (role === "SECTION_HEAD" && sectionId != null) {
    where.sectionId = sectionId;
  } else if (departmentId != null) {
    where.departmentId = departmentId;
  } else if (role === "EMPLOYEE" || role === "DEPT_MANAGER" || role === "SECTION_HEAD") {
    // مستخدم بلا إدارة لا يرى متطلبات مسندة لإدارات أخرى بالخطأ
    where.departmentId = -1;
  }

  const requirements = await db.measurementRequirement.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      polarity: true,
      frequency: true,
      requiredData: true,
      ownerId: true,
      fillerRole: true,
      departmentId: true,
      sectionId: true,
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      periods: {
        where: { year, period },
        take: 1,
        include: {
          evidences: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              sizeBytes: true,
              createdAt: true,
              status: true,
              rejectReason: true,
            },
          },
        },
      },
      kpis: {
        where: { active: true },
        select: { id: true, code: true, type: true, name: true },
        orderBy: { code: "asc" },
      },
    },
    orderBy: { code: "asc" },
  });

  return requirements.map((req) => {
    const measurement = req.periods[0] ?? null;
    return {
      requirement: {
        id: req.id,
        code: req.code,
        name: req.name,
        unit: req.unit,
        polarity: req.polarity,
        frequency: req.frequency,
        requiredData: req.requiredData,
        ownerId: req.ownerId,
        fillerRole: req.fillerRole,
        departmentId: req.departmentId,
        sectionId: req.sectionId,
        departmentName: req.department?.name ?? null,
        sectionName: req.section?.name ?? null,
      },
      measurement: measurement
        ? {
            id: measurement.id,
            actualValue: measurement.actualValue,
            whatHappened: measurement.whatHappened,
            howHappened: measurement.howHappened,
            note: measurement.note,
            approvalStatus: measurement.approvalStatus,
            rejectReason: measurement.rejectReason,
            suggestedWording: measurement.suggestedWording,
            reviewFeedback: measurement.reviewFeedback,
            evidences: measurement.evidences,
          }
        : null,
      kpis: req.kpis.map((k) => ({
        id: k.id,
        code: k.code,
        type: k.type,
        name: k.name,
      })),
      periods: resolvePeriods(req.frequency),
    };
  });
}

/** يلغي إسناد المتطلبات التي لا تطابق إدارة/قسم المالك الحالي — تراكمياً لا يحذف التاريخ */
export async function clearCrossDepartmentAssignments(userId?: number) {
  const owners = await db.user.findMany({
    where: {
      ...(userId != null ? { id: userId } : {}),
      status: "ACTIVE",
      role: { in: ["EMPLOYEE", "SECTION_HEAD", "DEPT_MANAGER"] },
      departmentId: { not: null },
    },
    select: { id: true, departmentId: true, sectionId: true, role: true },
  });

  let cleared = 0;
  for (const u of owners) {
    if (u.departmentId == null) continue;
    const mismatched = await db.measurementRequirement.findMany({
      where: {
        ownerId: u.id,
        active: true,
        NOT: { departmentId: u.departmentId },
      },
      select: { id: true },
    });
    if (mismatched.length === 0) continue;
    const ids = mismatched.map((r) => r.id);
    await db.measurementRequirement.updateMany({
      where: { id: { in: ids } },
      data: { ownerId: null },
    });
    await db.kpi.updateMany({
      where: { requirementId: { in: ids } },
      data: { ownerId: null },
    });
    cleared += ids.length;
  }
  return cleared;
}
