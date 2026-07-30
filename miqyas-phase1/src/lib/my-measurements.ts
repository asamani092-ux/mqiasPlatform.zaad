import type { Period } from "@prisma/client";
import { db } from "@/lib/db";
import { resolvePeriods } from "@/lib/kpi";

/** متطلبات القياس المسندة للمستخدم مع فترة القياس والشواهد والمؤشرات المرتبطة */
export async function getMyRequirements(userId: number, year: number, period: Period) {
  const requirements = await db.measurementRequirement.findMany({
    where: { active: true, ownerId: userId },
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      polarity: true,
      frequency: true,
      requiredData: true,
      ownerId: true,
      departmentId: true,
      sectionId: true,
      periods: {
        where: { year, period },
        take: 1,
        include: {
          evidences: {
            select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
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
        departmentId: req.departmentId,
        sectionId: req.sectionId,
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
