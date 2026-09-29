import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import CalendarClient from "@/components/CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewDeptCalendar(user)) redirect("/my");

  return <CalendarClient canManage={can.manageDeptCalendar(user)} />;
}
