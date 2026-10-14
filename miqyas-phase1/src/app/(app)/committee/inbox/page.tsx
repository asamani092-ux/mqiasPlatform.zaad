import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can, isAuditTeam } from "@/lib/rbac";
import CommitteeInboxClient from "@/components/CommitteeInboxClient";

export const dynamic = "force-dynamic";

export default async function CommitteeInboxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewCommittee(user)) redirect("/dashboard");
  return (
    <CommitteeInboxClient
      canManage={can.manageCommittee(user)}
      canUpload={can.manageCommittee(user) || isAuditTeam(user)}
    />
  );
}
