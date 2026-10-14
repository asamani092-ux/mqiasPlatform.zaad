import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import CommitteeDecisionsClient from "@/components/CommitteeDecisionsClient";

export const dynamic = "force-dynamic";

export default async function CommitteeDecisionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewCommittee(user)) redirect("/dashboard");
  return <CommitteeDecisionsClient canManage={can.manageCommittee(user)} />;
}
