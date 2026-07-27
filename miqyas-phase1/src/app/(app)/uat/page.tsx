import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isUatEnabled } from "@/lib/uat-enabled";
import UatChecklistClient from "@/components/UatChecklistClient";

export const dynamic = "force-dynamic";

export default async function UatPage() {
  if (!isUatEnabled()) notFound();

  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <UatChecklistClient />;
}
