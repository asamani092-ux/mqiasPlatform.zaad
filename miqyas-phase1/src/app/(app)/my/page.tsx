import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getMyRequirements } from "@/lib/my-measurements";
import { parseTrackParams } from "@/lib/track-params";
import MyKpisClient from "@/components/MyKpisClient";

export const dynamic = "force-dynamic";

export default async function MyPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const userId = parseInt(user.id, 10);
  const { year, period } = await parseTrackParams(searchParams);
  const initialItems = await getMyRequirements(
    {
      userId,
      role: user.role,
      departmentId: user.departmentId,
      sectionId: user.sectionId,
    },
    year,
    period
  );

  return (
    <MyKpisClient
      initialYear={year}
      initialPeriod={period}
      initialItems={initialItems}
    />
  );
}
