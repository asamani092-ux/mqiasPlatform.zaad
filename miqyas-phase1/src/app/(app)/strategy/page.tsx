import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import StrategyCatalogClient from "@/components/StrategyCatalogClient";

export const dynamic = "force-dynamic";

export default async function StrategyCatalogPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewStrategyOffice(user)) redirect("/my");

  return <StrategyCatalogClient canManage={can.manageStrategyCatalog(user)} />;
}
