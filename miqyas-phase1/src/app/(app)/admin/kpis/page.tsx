import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AdminKpisClient from "@/components/AdminKpisClient";

export const dynamic = "force-dynamic";

export default async function AdminKpisPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.manageKpis(user)) redirect("/dashboard");
  return <AdminKpisClient />;
}
