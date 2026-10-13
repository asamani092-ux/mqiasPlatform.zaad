import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AuditReportsClient from "@/components/AuditReportsClient";

export const dynamic = "force-dynamic";

export default async function AuditReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewAuditOffice(user)) redirect("/my");

  return <AuditReportsClient canManage={can.manageAuditReports(user)} />;
}
