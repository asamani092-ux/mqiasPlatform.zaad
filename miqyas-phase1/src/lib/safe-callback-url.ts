/** يقبل مسارات نسبية داخل المنصة فقط — يمنع open redirect · O(1) */
export function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}
