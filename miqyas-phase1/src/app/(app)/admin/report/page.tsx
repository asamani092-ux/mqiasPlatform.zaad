import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AdminReportClient from "@/components/AdminReportClient";

export const dynamic = "force-dynamic";

export default async function AdminReportPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.manageKpis(user)) redirect("/dashboard");
  return <AdminReportClient />;
}
