import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function audit(
  userId: number | null,
  action: string,
  entity?: string,
  entityId?: number,
  meta?: Record<string, unknown>,
  ip?: string,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        entity,
        entityId,
        meta: meta as Prisma.InputJsonValue | undefined,
        ip,
      },
    });
  } catch {
    // لا نكسر التطبيق بسبب فشل التدقيق
  }
}
