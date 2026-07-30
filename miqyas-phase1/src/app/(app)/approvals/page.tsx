import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getApprovalDelegationFlags } from "@/lib/approval-settings";
import ApprovalsClient from "@/components/ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const flags = await getApprovalDelegationFlags();
  if (!can.approveEntries(user, flags)) {
    redirect("/dashboard");
  }

  return <ApprovalsClient />;
}
