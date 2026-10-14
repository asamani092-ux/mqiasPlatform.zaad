import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import CommitteeBoardClient from "@/components/CommitteeBoardClient";

export const dynamic = "force-dynamic";

export default async function CommitteePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewCommittee(user)) redirect("/dashboard");
  return <CommitteeBoardClient />;
}
