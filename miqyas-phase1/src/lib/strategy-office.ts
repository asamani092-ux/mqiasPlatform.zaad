import type { MeasurementDomain } from "@prisma/client";
import type { SessionUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { isStrategySectionMeta, STRATEGY_SECTION_CODE } from "@/lib/strategy-meta";
import { DOMAIN_LABEL } from "@/lib/types";

export { DOMAIN_LABEL, isStrategySectionMeta, STRATEGY_SECTION_CODE };

export function domainFromKpiType(type: "STRATEGIC" | "OPERATIONAL"): MeasurementDomain {
  return type === "OPERATIONAL" ? "OPERATIONAL" : "STRATEGIC";
}

/**
 * عضو مكتب الاستراتيجية (مشرف أو مرتبط بقسم الاستراتيجية).
 * زمن: O(1) مع بيانات الجلسة · وإلا استعلام واحد
 */
export async function isStrategyOfficeMember(user: SessionUser): Promise<boolean> {
  if (user.role === "SYSTEM_ADMIN") return true;
  if (user.sectionName && isStrategySectionMeta({ name: user.sectionName, code: user.sectionCode })) {
    return true;
  }
  if (user.sectionId == null) return false;
  const section = await db.section.findUnique({
    where: { id: user.sectionId },
    select: { code: true, name: true },
  });
  return !!section && isStrategySectionMeta(section);
}

/** نطاق كتالوج المؤشرات عند التحرير من مدير إدارة */
export function catalogDeptScope(user: SessionUser): { departmentId: number } | null {
  if (user.role === "DEPT_MANAGER" && user.departmentId != null) {
    return { departmentId: user.departmentId };
  }
  return null;
}
