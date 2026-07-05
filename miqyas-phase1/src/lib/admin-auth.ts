import type { SessionUser } from "@/lib/rbac";
import { can } from "@/lib/rbac";

export type ForbiddenError = { status: 403; message: string };

export function requireManageKpis(user: SessionUser): void {
  if (!can.manageKpis(user)) {
    throw { status: 403 as const, message: "غير مصرح — مشرف النظام فقط" };
  }
}

export function handleForbidden(e: unknown) {
  if (e && typeof e === "object" && "status" in e && (e as ForbiddenError).status === 403) {
    return { error: (e as ForbiddenError).message, status: 403 };
  }
  return null;
}
