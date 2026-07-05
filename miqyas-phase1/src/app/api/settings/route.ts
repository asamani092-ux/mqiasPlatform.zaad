import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { setSetting, getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const ALLOWED_KEYS = [
  "section_head_can_approve",
  "early_warning_gap_pct",
  "action_escalation_days",
  "current_year",
] as const;

const postSchema = z.object({
  key: z.enum(ALLOWED_KEYS),
  value: z.string().min(1).max(500),
});

const LABELS: Record<string, string> = {
  section_head_can_approve: "تفويض رؤساء الأقسام باعتماد مؤشرات موظفيهم",
  early_warning_gap_pct: "نسبة فجوة تفعيل الإنذار المبكر (%)",
  action_escalation_days: "مهلة تصعيد الإجراءات المتأخرة (أيام)",
  current_year: "سنة القياس الحالية",
};

export async function GET() {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const settings = await Promise.all(
      ALLOWED_KEYS.map(async (key) => ({
        key,
        label: LABELS[key],
        value: await getSetting(key),
      })),
    );

    return NextResponse.json({ settings });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const body = postSchema.parse(await req.json());
    await setSetting(body.key, body.value);
    await audit(parseInt(user.id, 10), "UPDATE_SETTING", "SystemSetting", undefined, body);

    return NextResponse.json({ ok: true, key: body.key, value: body.value });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
