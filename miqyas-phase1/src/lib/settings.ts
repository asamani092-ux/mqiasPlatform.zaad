import { db } from "@/lib/db";

const DEFAULTS: Record<string, string> = {
  section_head_can_approve: "0",
  early_warning_gap_pct: "20",
  action_escalation_days: "0",
  current_year: String(new Date().getFullYear()),
};

export async function getSetting(key: string): Promise<string> {
  const row = await db.systemSetting.findUnique({ where: { key } });
  if (row) return row.value;
  return DEFAULTS[key] ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
