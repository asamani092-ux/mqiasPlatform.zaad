import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AuditPapersClient from "@/components/AuditPapersClient";

export const dynamic = "force-dynamic";

export default async function AuditPapersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.manageAuditPapers(user)) redirect("/audit");

  return <AuditPapersClient />;
}
