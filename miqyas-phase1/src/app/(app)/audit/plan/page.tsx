import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AuditPlanClient from "@/components/AuditPlanClient";

export const dynamic = "force-dynamic";

export default async function AuditPlanPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewAuditOffice(user)) redirect("/my");

  return <AuditPlanClient canManage={can.manageAuditPlan(user)} />;
}
