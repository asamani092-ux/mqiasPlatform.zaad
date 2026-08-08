import { getSetting } from "@/lib/settings";

/** هل جولة القياس مفتوحة؟ O(1) زمنًا ومكانًا */
export async function isMeasurementRoundOpen(): Promise<boolean> {
  return (await getSetting("measurement_round_open")) !== "0";
}

export const ROUND_CLOSED_UPLOAD_MSG =
  "جولة القياس مغلقة — لا يمكن رفع الشواهد أو حذفها حتى يعيد المشرف فتح الجولة";

export const ROUND_CLOSED_INITIAL_MSG =
  "جولة القياس مغلقة — الاعتماد المبدئي وإرجاع الإدارة متوقفان؛ الاعتماد النهائي متاح للمشرف";

export const ROUND_CLOSED_SUBMIT_MSG =
  "جولة القياس مغلقة حالياً — يمكن حفظ القياس كمسودة فقط؛ التقديم والرفع والاعتماد المبدئي متوقفة";
