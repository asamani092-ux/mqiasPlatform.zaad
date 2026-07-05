import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getExecutiveSnapshot } from "@/lib/executive";
import { parseTrackParams } from "@/lib/track-params";
import ExecutiveClient from "@/components/ExecutiveClient";

export const dynamic = "force-dynamic";

export default async function ExecutivePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.viewExecutive(user)) redirect("/dashboard");

  const { year, period } = parseTrackParams(searchParams);
  const snapshot = await getExecutiveSnapshot({ year, period });

  return <ExecutiveClient snapshot={snapshot} year={year} period={period} />;
}
