import type { Frequency, MeasurementDomain, Polarity, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { roleToFillerRole, type FillerRoleValue } from "@/lib/approval-status";
import { domainFromKpiType } from "@/lib/strategy-office";

type Tx = Prisma.TransactionClient | typeof db;

/** حقول المؤشر اللازمة لضمان متطلب القياس الموحّد */
export type KpiForRequirementSync = {
  id: number;
  code: string;
  name: string;
  unit: string;
  polarity: Polarity;
  frequency: Frequency;
  requiredData: string | null;
  departmentId: number | null;
  sectionId: number | null;
  ownerId: number | null;
  requirementId: number | null;
  active: boolean;
  domain?: MeasurementDomain;
  type?: "STRATEGIC" | "OPERATIONAL";
};

/**
 * ضمان/تحديث MeasurementRequirement من المؤشر وربط Kpi.requirementId.
 * زمن: O(1) · مكان: O(1)
 */
export async function ensureRequirementFromKpi(
  kpi: KpiForRequirementSync,
  tx: Tx = db,
): Promise<void> {
  let fillerRole: FillerRoleValue | undefined;

  if (kpi.ownerId != null) {
    const owner = await tx.user.findUnique({
      where: { id: kpi.ownerId },
      select: { role: true },
    });
    const mapped = owner ? roleToFillerRole(owner.role) : null;
    if (mapped) fillerRole = mapped;
  }

  const domain: MeasurementDomain =
    kpi.domain ?? (kpi.type ? domainFromKpiType(kpi.type) : "STRATEGIC");

  const base = {
    name: kpi.name,
    unit: kpi.unit,
    polarity: kpi.polarity,
    frequency: kpi.frequency,
    requiredData: kpi.requiredData,
    departmentId: kpi.departmentId,
    sectionId: kpi.sectionId,
    ownerId: kpi.ownerId,
    active: kpi.active,
    domain,
  };

  const req = await tx.measurementRequirement.upsert({
    where: { code: kpi.code },
    create: {
      code: kpi.code,
      ...base,
      fillerRole: fillerRole ?? "EMPLOYEE",
    },
    update: {
      ...base,
      ...(fillerRole ? { fillerRole } : {}),
    },
  });

  if (kpi.requirementId == null || kpi.requirementId !== req.id) {
    await tx.kpi.update({
      where: { id: kpi.id },
      data: { requirementId: req.id, domain },
    });
  } else if (kpi.domain == null) {
    await tx.kpi.update({
      where: { id: kpi.id },
      data: { domain },
    });
  }
}

/**
 * غلاف توافق: مزامنة مالك/متطلب المؤشر عبر ensureRequirementFromKpi.
 * زمن: O(1) · مكان: O(1)
 */
export async function syncRequirementOwnerFromKpi(
  kpi: KpiForRequirementSync,
  tx: Tx = db,
): Promise<void> {
  await ensureRequirementFromKpi(kpi, tx);
}
