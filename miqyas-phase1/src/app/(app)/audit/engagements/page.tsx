import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AuditEngagementsClient from "@/components/AuditEngagementsClient";

export const dynamic = "force-dynamic";

export default async function AuditEngagementsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewAuditOffice(user)) redirect("/my");

  return <AuditEngagementsClient canManage={can.manageAuditEngagements(user)} />;
}
