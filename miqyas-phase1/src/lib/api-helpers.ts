import { NextResponse } from "next/server";
import type { AuthError } from "@/lib/auth";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(e: unknown) {
  if (e && typeof e === "object" && "status" in e && (e as AuthError).status === 401) {
    return jsonError("غير مصرح", 401);
  }
  if (e instanceof Error && e.message.startsWith("Zod")) {
    return jsonError("بيانات غير صالحة", 400);
  }
  console.error(e);
  return jsonError("خطأ داخلي", 500);
}
