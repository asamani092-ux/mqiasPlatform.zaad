export const ASSET_TYPES = [
  "دليل",
  "سياسة",
  "إجراء",
  "درس مستفاد",
  "قالب",
  "تقرير",
  "أخرى",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];
