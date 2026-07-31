import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

/** إشعار المدخل + المالك + مديري إدارة المتطلب عند الإعادة/الرفض */
export async function notifyMeasurementReturn(params: {
  measurementPeriodId: number;
  requirementCode: string;
  requirementName: string;
  departmentId: number | null;
  ownerId: number | null;
  enteredById: number | null;
  title: string;
  body: string;
  includeDeptManagers: boolean;
}): Promise<void> {
  const userIds = new Set<number>();
  if (params.enteredById) userIds.add(params.enteredById);
  if (params.ownerId) userIds.add(params.ownerId);

  if (params.includeDeptManagers && params.departmentId != null) {
    const managers = await db.user.findMany({
      where: {
        role: "DEPT_MANAGER",
        status: "ACTIVE",
        departmentId: params.departmentId,
      },
      select: { id: true },
    });
    for (const m of managers) userIds.add(m.id);
  }

  const ids = Array.from(userIds);
  if (ids.length === 0) return;

  const link = `/my?mp=${params.measurementPeriodId}`;
  await notify({
    userIds: ids,
    type: "APPROVAL_RESULT",
    title: params.title,
    body: `${params.requirementCode} — ${params.requirementName}\n${params.body}`,
    link,
    email: true,
  });
}
