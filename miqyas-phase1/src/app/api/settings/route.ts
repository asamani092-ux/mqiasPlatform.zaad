import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { setSetting, getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const ALLOWED_KEYS = [
  "section_head_can_approve",
  "dept_manager_can_approve",
  "early_warning_gap_pct",
  "action_escalation_days",
  "current_year",
  "current_period",
  "measurement_round_year",
  "measurement_round_period",
  "measurement_round_open",
  "notify_from_email",
] as const;

const PERIOD_VALUES = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"] as const;

const postSchema = z
  .object({
    key: z.enum(ALLOWED_KEYS),
    value: z.string().max(500),
  })
  .superRefine((data, ctx) => {
    if (data.key === "notify_from_email") {
      // يُسمح بالإفراغ (عودة لقيمة .env) أو بريد صالح
      if (data.value.trim() && !z.string().email().safeParse(data.value.trim()).success) {
        ctx.addIssue({ code: "custom", message: "بريد المرسل غير صالح" });
      }
    } else if (data.key === "current_year" || data.key === "measurement_round_year") {
      if (!/^\d{4}$/.test(data.value.trim())) {
        ctx.addIssue({ code: "custom", message: "السنة غير صالحة" });
      }
    } else if (data.key === "current_period" || data.key === "measurement_round_period") {
      if (!PERIOD_VALUES.includes(data.value as (typeof PERIOD_VALUES)[number])) {
        ctx.addIssue({ code: "custom", message: "الفترة غير صالحة" });
      }
    } else if (data.key === "measurement_round_open") {
      if (data.value !== "0" && data.value !== "1") {
        ctx.addIssue({ code: "custom", message: "حالة الجولة غير صالحة" });
      }
    } else if (data.value.length === 0) {
      ctx.addIssue({ code: "custom", message: "القيمة مطلوبة" });
    }
  });

const LABELS: Record<string, string> = {
  section_head_can_approve: "تفويض رؤساء الأقسام باعتماد مؤشرات موظفيهم",
  dept_manager_can_approve: "تفويض مديري الإدارات باعتماد قياسات إدارتهم",
  early_warning_gap_pct: "نسبة فجوة تفعيل الإنذار المبكر (%)",
  action_escalation_days: "مهلة تصعيد الإجراءات المتأخرة (أيام)",
  current_year: "سنة القياس الحالية",
  current_period: "الفترة الحالية",
  measurement_round_year: "سنة جولة القياس",
  measurement_round_period: "فترة جولة القياس",
  measurement_round_open: "حالة جولة القياس (1 مفتوحة / 0 مغلقة)",
  notify_from_email: "بريد المرسل للتنبيهات",
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
    await setSetting(body.key, body.key === "notify_from_email" ? body.value.trim() : body.value);
    await audit(parseInt(user.id, 10), "UPDATE_SETTING", "SystemSetting", undefined, body);

    return NextResponse.json({ ok: true, key: body.key, value: body.value });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
