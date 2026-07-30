import { db } from "@/lib/db";

const DEFAULTS: Record<string, string> = {
  section_head_can_approve: "0",
  dept_manager_can_approve: "0",
  early_warning_gap_pct: "20",
  action_escalation_days: "0",
  current_year: String(new Date().getFullYear()),
  current_period: (() => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return "Q1";
    if (month <= 6) return "Q2";
    if (month <= 9) return "Q3";
    return "Q4";
  })(),
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
