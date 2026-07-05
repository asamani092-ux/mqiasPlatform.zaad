import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSetting } from "@/lib/settings";
import ApprovalsClient from "@/components/ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const delegationOn = (await getSetting("section_head_can_approve")) === "1";
  if (!can.approveEntries(user, delegationOn)) {
    redirect("/dashboard");
  }

  return <ApprovalsClient />;
}
