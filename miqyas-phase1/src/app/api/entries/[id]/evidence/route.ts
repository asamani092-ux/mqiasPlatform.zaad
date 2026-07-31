import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

/** STEP 8 — شواهد المسار التراثي معطّلة للكتابة */
export async function POST(
  _req: NextRequest,
  _ctx: { params: { id: string } }
) {
  try {
    await requireUser();
    return jsonError("استخدم مسار شواهد القياسات الموحّد (/api/my/measurements/[id]/evidence)", 410);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  _ctx: { params: { id: string } }
) {
  try {
    await requireUser();
    return jsonError("استخدم مسار شواهد القياسات الموحّد (/api/my/measurements/[id]/evidence)", 410);
  } catch (e) {
    return handleApiError(e);
  }
}
