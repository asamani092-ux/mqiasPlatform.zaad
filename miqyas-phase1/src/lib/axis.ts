export type StrategicAxis = "customers" | "financial" | "operations" | "learning";

export const AXIS_LABEL: Record<StrategicAxis, string> = {
  customers: "محور العملاء",
  financial: "المحور المالي",
  operations: "العمليات الداخلية",
  learning: "التعلم والنمو",
};

export const AXIS_ORDER: StrategicAxis[] = [
  "customers",
  "financial",
  "operations",
  "learning",
];

const CODE_MAP: Record<string, StrategicAxis> = {
  ع: "customers",
  م: "financial",
  د: "operations",
  ن: "learning",
};

/** Big O: O(1) time, O(1) space */
export function axisOf(goalCode: string | null | undefined): StrategicAxis | null {
  if (!goalCode) return null;
  const letter = goalCode.trim().charAt(0);
  return CODE_MAP[letter] ?? null;
}

export function axisLabelOf(goalCode: string | null | undefined): string {
  const axis = axisOf(goalCode);
  return axis ? AXIS_LABEL[axis] : "بدون محور";
}
