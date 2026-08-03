import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

describe("safeCallbackUrl", () => {
  it("يحافظ على المسارات النسبية مع ?mp=", () => {
    expect(safeCallbackUrl("/my?mp=12")).toBe("/my?mp=12");
    expect(safeCallbackUrl("/approvals?mp=3")).toBe("/approvals?mp=3");
  });

  it("يرفض الروابط الخارجية والمشبوهة", () => {
    expect(safeCallbackUrl("https://evil.test")).toBe("/dashboard");
    expect(safeCallbackUrl("//evil.test")).toBe("/dashboard");
    expect(safeCallbackUrl(null)).toBe("/dashboard");
  });
});
