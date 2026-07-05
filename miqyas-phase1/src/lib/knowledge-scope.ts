import type { Period } from "@prisma/client";
import type { SessionUser } from "@/lib/rbac";

export function scopedKnowledgeWhere(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case "SYSTEM_ADMIN":
    case "EXECUTIVE":
      return {};
    case "DEPT_MANAGER":
    case "SECTION_HEAD":
    case "EMPLOYEE":
      return user.departmentId != null ? { departmentId: user.departmentId } : { departmentId: -1 };
    default:
      return { departmentId: -1 };
  }
}

export function previousPeriod(year: number, period: Period): { year: number; period: Period } {
  const order: Period[] = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"];
  const idx = order.indexOf(period);
  if (idx <= 0) return { year: year - 1, period: period === "Q1" ? "Q4" : order[idx - 1] ?? "Y" };
  return { year, period: order[idx - 1]! };
}
