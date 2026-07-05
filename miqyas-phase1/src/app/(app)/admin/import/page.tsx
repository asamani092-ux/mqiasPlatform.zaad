import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import ImportClient from "@/components/ImportClient";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.manageKpis(user)) redirect("/dashboard");
  return <ImportClient />;
}
