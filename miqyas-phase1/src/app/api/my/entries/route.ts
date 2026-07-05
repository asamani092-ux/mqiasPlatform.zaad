import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMyKpiEntries } from "@/lib/my-entries";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
});

/** يُرجع مؤشرات المستخدم الحالي فقط — فلترة من الخادم */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const userId = parseInt(user.id, 10);
    const items = await getMyKpiEntries(userId, params.year, params.period);
    return NextResponse.json({ year: params.year, period: params.period, items });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}
