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

/** الفترة السابقة لنفس نوع الدورية — O(1) زمنًا ومكانًا */
export function previousPeriod(year: number, period: Period): { year: number; period: Period } {
  switch (period) {
    case "Q1":
      return { year: year - 1, period: "Q4" };
    case "Q2":
      return { year, period: "Q1" };
    case "Q3":
      return { year, period: "Q2" };
    case "Q4":
      return { year, period: "Q3" };
    case "H1":
      return { year: year - 1, period: "H2" };
    case "H2":
      return { year, period: "H1" };
    case "Y":
      return { year: year - 1, period: "Y" };
    default:
      return { year: year - 1, period: "Y" };
  }
}
