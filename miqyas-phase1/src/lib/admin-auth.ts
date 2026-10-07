import type { SessionUser } from "@/lib/rbac";
import { can } from "@/lib/rbac";

export type ForbiddenError = { status: 403; message: string };

export function requireManageKpis(user: SessionUser): void {
  if (!can.manageKpis(user)) {
    throw { status: 403 as const, message: "غير مصرح — مشرف النظام فقط" };
  }
}

/** كتابة تعريف المؤشر (الواجهة الموحّدة) — أوسع من manageKpis */
export function requireWriteKpis(user: SessionUser): void {
  if (!can.writeKpis(user)) {
    throw { status: 403 as const, message: "غير مصرح — إدارة المؤشرات" };
  }
}

/** كتالوج الاستراتيجية/الحوكمة — مشرف أو مكتب الاستراتيجية أو مدير إدارة */
export function requireManageStrategyCatalog(user: SessionUser): void {
  if (!can.manageStrategyCatalog(user)) {
    throw { status: 403 as const, message: "غير مصرح — كتالوج الاستراتيجية" };
  }
}

export function requireManageUsers(user: SessionUser): void {
  if (!can.manageUsers(user)) {
    throw { status: 403 as const, message: "غير مصرح — مشرف النظام فقط" };
  }
}

export function handleForbidden(e: unknown) {
  if (e && typeof e === "object" && "status" in e && (e as ForbiddenError).status === 403) {
    return { error: (e as ForbiddenError).message, status: 403 };
  }
  return null;
}
