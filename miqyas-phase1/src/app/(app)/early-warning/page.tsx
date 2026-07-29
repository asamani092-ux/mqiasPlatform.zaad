import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { parseTrackParams } from "@/lib/track-params";
import { getLiveEarlyWarnings } from "@/lib/early-warning-live";
import { summarizeEarlyWarning } from "@/lib/early-warning-stats";
import EarlyWarningClient from "@/components/EarlyWarningClient";

export const dynamic = "force-dynamic";

export default async function EarlyWarningPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { year, period } = await parseTrackParams(searchParams);

  const rows = await getLiveEarlyWarnings({ user, year, period });
  const summary = summarizeEarlyWarning(rows);

  return (
    <EarlyWarningClient
      rows={rows}
      summary={summary}
      year={year}
      period={period}
    />
  );
}
