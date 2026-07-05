import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { currentQuarter } from "@/lib/kpi";
import { getMyKpiEntries } from "@/lib/my-entries";
import MyKpisClient from "@/components/MyKpisClient";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const userId = parseInt(user.id, 10);
  const { year, period } = currentQuarter();
  const initialItems = await getMyKpiEntries(userId, year, period);

  return (
    <MyKpisClient
      initialYear={year}
      initialPeriod={period}
      initialItems={initialItems}
    />
  );
}
