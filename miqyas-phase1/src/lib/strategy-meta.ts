/** رمز قسم الاستراتيجية في البذرة (إدارة الأداء والنمو) */
export const STRATEGY_SECTION_CODE = "4/1";

/** هل اسم/رمز القسم ينتمي لمكتب الاستراتيجية؟ */
export function isStrategySectionMeta(meta: {
  code?: string | null;
  name?: string | null;
}): boolean {
  if (meta.code === STRATEGY_SECTION_CODE) return true;
  const name = meta.name?.trim() ?? "";
  return name.includes("الاستراتيجية");
}
