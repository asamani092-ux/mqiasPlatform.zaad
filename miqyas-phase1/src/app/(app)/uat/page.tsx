import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import UatChecklistClient from "@/components/UatChecklistClient";

export const dynamic = "force-dynamic";

export default async function UatPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <UatChecklistClient />;
}
