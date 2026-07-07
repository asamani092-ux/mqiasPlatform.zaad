import { z } from "zod";
import type { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ROLE_VALUES } from "@/lib/types";

export { ROLE_VALUES };

export const roleSchema = z.enum(ROLE_VALUES);
export const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
  role: roleSchema,
  departmentId: z.number().int().positive().optional().nullable(),
  sectionId: z.number().int().positive().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: roleSchema.optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  sectionId: z.number().int().positive().optional().nullable(),
  status: statusSchema.optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export const toggleStatusSchema = z.object({
  status: statusSchema,
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: roleSchema.optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

export type RoleScope = {
  departmentId: number | null;
  sectionId: number | null;
};

export async function resolveRoleScope(
  role: Role,
  departmentId?: number | null,
  sectionId?: number | null,
): Promise<RoleScope> {
  switch (role) {
    case "DEPT_MANAGER": {
      if (departmentId == null) {
        throw { status: 400 as const, message: "مدير الإدارة يتطلب اختيار إدارة" };
      }
      const dept = await db.department.findUnique({ where: { id: departmentId }, select: { id: true } });
      if (!dept) throw { status: 400 as const, message: "الإدارة المحددة غير موجودة" };
      return { departmentId, sectionId: null };
    }
    case "SECTION_HEAD":
    case "EMPLOYEE": {
      if (sectionId == null) {
        throw { status: 400 as const, message: "رئيس القسم/الموظف يتطلب اختيار قسم" };
      }
      const section = await db.section.findUnique({
        where: { id: sectionId },
        select: { id: true, departmentId: true },
      });
      if (!section) throw { status: 400 as const, message: "القسم المحدد غير موجود" };
      return { departmentId: section.departmentId, sectionId };
    }
    case "EXECUTIVE":
    case "SYSTEM_ADMIN":
      return { departmentId: null, sectionId: null };
    default:
      throw { status: 400 as const, message: "دور غير صالح" };
  }
}

export async function countActiveSystemAdmins(excludeUserId?: number): Promise<number> {
  return db.user.count({
    where: {
      role: "SYSTEM_ADMIN",
      status: "ACTIVE",
      ...(excludeUserId != null ? { id: { not: excludeUserId } } : {}),
    },
  });
}

export function assertSelfAdminGuard(
  currentUserId: string,
  targetUserId: number,
  changes: { role?: Role; status?: UserStatus },
): void {
  if (String(targetUserId) !== currentUserId) return;

  if (changes.status === "INACTIVE") {
    throw { status: 400 as const, message: "لا يمكنك تعطيل حسابك الخاص" };
  }
  if (changes.role && changes.role !== "SYSTEM_ADMIN") {
    throw { status: 400 as const, message: "لا يمكنك إزالة صلاحيات المشرف من حسابك الخاص" };
  }
}

export async function assertLastAdminGuard(
  targetUserId: number,
  targetRole: Role,
  targetStatus: UserStatus,
  changes: { role?: Role; status?: UserStatus },
): Promise<void> {
  if (targetRole !== "SYSTEM_ADMIN" || targetStatus !== "ACTIVE") return;

  const nextRole = changes.role ?? targetRole;
  const nextStatus = changes.status ?? targetStatus;
  const wouldRemoveActiveAdmin = nextStatus === "INACTIVE" || nextRole !== "SYSTEM_ADMIN";

  if (!wouldRemoveActiveAdmin) return;

  const others = await countActiveSystemAdmins(targetUserId);
  if (others === 0) {
    throw {
      status: 400 as const,
      message: "لا يمكن تعطيل أو إزالة صلاحيات آخر مشرف نظام نشط",
    };
  }
}
