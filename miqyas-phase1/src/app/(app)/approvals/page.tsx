import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import ApprovalsClient from "@/components/ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.finalApprove(user)) redirect("/dashboard");
  return <ApprovalsClient />;
}
