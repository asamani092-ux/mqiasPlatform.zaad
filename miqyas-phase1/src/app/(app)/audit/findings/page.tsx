import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AuditFindingsClient from "@/components/AuditFindingsClient";

export const dynamic = "force-dynamic";

export default async function AuditFindingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewAuditOffice(user)) redirect("/my");

  return <AuditFindingsClient canManage={can.manageAuditFindings(user)} />;
}
