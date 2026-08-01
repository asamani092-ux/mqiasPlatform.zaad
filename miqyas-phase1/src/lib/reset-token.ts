import { createHash } from "crypto";

/** يُخزَّن تجزيء SHA-256 للتوكن فقط — الرابط الخام يصل للبريد ولا يُحفظ */
export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
