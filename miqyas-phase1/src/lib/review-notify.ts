import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

/**
 * إشعار المالك بـ /my والمديرين بـ /dept-follow.
 * لا يُشعر المدخل بـ /my إن لم يكن المالك الحالي (لن يظهر في شواهد المؤشرات).
 */
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
  const bodyText = `${params.requirementCode} — ${params.requirementName}\n${params.body}`;
  const myLink = `/my?mp=${params.measurementPeriodId}`;
  const deptLink = "/dept-follow";

  const ownerIds = new Set<number>();
  if (params.ownerId) ownerIds.add(params.ownerId);
  // المدخل فقط إن بقي مالكاً (يمرّ بفلتر /my)
  if (params.enteredById && params.enteredById === params.ownerId) {
    ownerIds.add(params.enteredById);
  }

  if (ownerIds.size > 0) {
    await notify({
      userIds: Array.from(ownerIds),
      type: "APPROVAL_RESULT",
      title: params.title,
      body: bodyText,
      link: myLink,
      email: true,
    });
  }

  if (params.includeDeptManagers && params.departmentId != null) {
    const managers = await db.user.findMany({
      where: {
        role: "DEPT_MANAGER",
        status: "ACTIVE",
        departmentId: params.departmentId,
      },
      select: { id: true },
    });
    const managerIds = managers.map((m) => m.id).filter((id) => !ownerIds.has(id));
    if (managerIds.length > 0) {
      await notify({
        userIds: managerIds,
        type: "APPROVAL_RESULT",
        title: params.title,
        body: bodyText,
        link: deptLink,
        email: true,
      });
    }
  }
}
