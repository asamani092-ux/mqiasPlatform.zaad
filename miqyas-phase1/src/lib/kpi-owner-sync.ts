import type { Frequency, MeasurementDomain, Polarity, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { roleToFillerRole, type FillerRoleValue } from "@/lib/approval-status";
import { deriveDomainFromFlags, resolveFeedFlags } from "@/lib/kpi-flags";
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
  feedsStrategic?: boolean;
  isGovernanceRequirement?: boolean;
};

async function syncGovernanceLink(
  opts: {
    code: string;
    name: string;
    requirementId: number;
    isGovernanceRequirement: boolean;
    ownerLabel: string | null;
  },
  tx: Tx,
): Promise<void> {
  if (opts.isGovernanceRequirement) {
    const year = new Date().getFullYear();
    const existing = await tx.governanceRequirement.findUnique({
      where: { code: opts.code },
      select: { id: true, measurementRequirementId: true },
    });
    if (existing) {
      if (existing.measurementRequirementId !== opts.requirementId) {
        await tx.governanceRequirement.update({
          where: { id: existing.id },
          data: { measurementRequirementId: opts.requirementId },
        });
      }
      return;
    }
    await tx.governanceRequirement.create({
      data: {
        code: opts.code,
        title: opts.name,
        year,
        owner: opts.ownerLabel,
        measurementRequirementId: opts.requirementId,
      },
    });
    return;
  }

  // فك الربط دون حذف سجل الحوكمة
  await tx.governanceRequirement.updateMany({
    where: { code: opts.code, measurementRequirementId: opts.requirementId },
    data: { measurementRequirementId: null },
  });
}

/**
 * ضمان/تحديث MeasurementRequirement من المؤشر وربط Kpi.requirementId + وسم الحوكمة.
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

  const type = kpi.type ?? (kpi.domain === "OPERATIONAL" ? "OPERATIONAL" : "STRATEGIC");
  const resolved = resolveFeedFlags({
    type,
    feedsStrategic: kpi.feedsStrategic,
    isGovernanceRequirement: kpi.isGovernanceRequirement,
    domain: kpi.domain ?? (kpi.type ? domainFromKpiType(kpi.type) : undefined),
  });

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
    domain: resolved.domain,
    feedsStrategic: resolved.feedsStrategic,
    isGovernanceRequirement: resolved.isGovernanceRequirement,
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

  const ownerRow = kpi.ownerId
    ? await tx.user.findUnique({ where: { id: kpi.ownerId }, select: { name: true } })
    : null;

  await syncGovernanceLink(
    {
      code: kpi.code,
      name: kpi.name,
      requirementId: req.id,
      isGovernanceRequirement: resolved.isGovernanceRequirement,
      ownerLabel: ownerRow?.name ?? null,
    },
    tx,
  );

  await tx.kpi.update({
    where: { id: kpi.id },
    data: {
      requirementId: req.id,
      domain: resolved.domain,
      feedsStrategic: resolved.feedsStrategic,
      isGovernanceRequirement: resolved.isGovernanceRequirement,
    },
  });
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

export { deriveDomainFromFlags };
