import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AuditSummaryClient from "@/components/AuditSummaryClient";

export const dynamic = "force-dynamic";

export default async function AuditSummaryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewAuditOffice(user)) redirect("/my");

  return (
    <AuditSummaryClient
      canManage={can.manageAuditPlan(user)}
      canManagePapers={can.manageAuditPapers(user)}
    />
  );
}
