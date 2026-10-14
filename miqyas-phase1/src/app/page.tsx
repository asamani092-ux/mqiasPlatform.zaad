import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user?.role === "INTERNAL_AUDITOR") redirect("/audit");
  if (session.user?.role === "AUDIT_COMMITTEE") redirect("/committee");
  redirect("/dashboard");
}
