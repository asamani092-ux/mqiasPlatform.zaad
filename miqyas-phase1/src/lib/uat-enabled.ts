/** بوابة بيئة التجربة — لا تفعّل في الإنتاج */
export function isUatEnabled(): boolean {
  return process.env.ENABLE_UAT === "true";
}
