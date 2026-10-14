import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import CommitteeMeetingsClient from "@/components/CommitteeMeetingsClient";

export const dynamic = "force-dynamic";

export default async function CommitteeMeetingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewCommittee(user)) redirect("/dashboard");
  return <CommitteeMeetingsClient canManage={can.manageCommittee(user)} />;
}
