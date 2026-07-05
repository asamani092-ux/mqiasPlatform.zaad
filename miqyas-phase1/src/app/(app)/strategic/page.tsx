import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getKpiRows, statusCounts } from "@/lib/analytics";
import { parseTrackParams } from "@/lib/track-params";
import StrategicTrackClient from "@/components/StrategicTrackClient";

export const dynamic = "force-dynamic";

export default async function StrategicPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = parseTrackParams(searchParams);
  const rows = await getKpiRows({ user, year, period, type: "STRATEGIC" });
  return <StrategicTrackClient rows={rows} counts={statusCounts(rows)} year={year} period={period} />;
}
