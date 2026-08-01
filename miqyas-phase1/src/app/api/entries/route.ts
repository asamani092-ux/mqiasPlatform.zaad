import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api-helpers";

/** المسار التراثي معطّل بالكامل — استخدم /api/my/measurements (لا مستدعين في الواجهة) */
export async function GET(_req: NextRequest) {
  return jsonError("استخدم مسار القياسات الموحّد (/my · /api/my/measurements)", 410);
}

export async function POST(_req: NextRequest) {
  return jsonError("استخدم مسار القياسات الموحّد (/my · /api/my/measurements)", 410);
}

export async function PUT(_req: NextRequest) {
  return jsonError("استخدم مسار القياسات الموحّد (/my · /api/my/measurements)", 410);
}

export async function DELETE(_req: NextRequest) {
  return jsonError("استخدم مسار القياسات الموحّد (/my · /api/my/measurements)", 410);
}
