import { describe, expect, it } from "vitest";
import { z } from "zod";
import { StatusConflictError, handleApiError } from "@/lib/api-helpers";

async function bodyOf(res: Response) {
  return { status: res.status, json: await res.json() };
}

describe("handleApiError", () => {
  it("ZodError → 400 (كان يسقط إلى 500)", async () => {
    let zodError: unknown;
    try {
      z.object({ year: z.number() }).parse({ year: "ليس رقماً" });
    } catch (e) {
      zodError = e;
    }
    const { status, json } = await bodyOf(handleApiError(zodError));
    expect(status).toBe(400);
    expect(json.error).toBe("بيانات غير صالحة");
  });

  it("StatusConflictError → 409 برسالة إعادة التحميل", async () => {
    const { status, json } = await bodyOf(handleApiError(new StatusConflictError()));
    expect(status).toBe(409);
    expect(json.error).toContain("أعِد التحميل");
  });

  it("خطأ 401/403 المهيكل يمر بحالته", async () => {
    expect((await bodyOf(handleApiError({ status: 401 }))).status).toBe(401);
    const forbidden = await bodyOf(handleApiError({ status: 403, message: "ممنوع" }));
    expect(forbidden.status).toBe(403);
    expect(forbidden.json.error).toBe("ممنوع");
  });

  it("خطأ غير معروف → 500", async () => {
    const { status } = await bodyOf(handleApiError(new Error("boom")));
    expect(status).toBe(500);
  });
});
