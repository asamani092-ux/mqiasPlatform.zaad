import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageUsers } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import {
  createUserSchema,
  listUsersQuerySchema,
  resolveRoleScope,
} from "@/lib/user-schemas";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  departmentId: true,
  sectionId: true,
  lastLogin: true,
  department: { select: { id: true, name: true } },
  section: { select: { id: true, name: true, code: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageUsers(user);

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = listUsersQuerySchema.parse(params);

    const where: {
      OR?: { name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }[];
      role?: typeof query.role;
      departmentId?: number;
    } = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.departmentId) where.departmentId = query.departmentId;

    const users = await db.user.findMany({
      where,
      select: userSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ users });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageUsers(user);

    const body = createUserSchema.parse(await req.json());

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) return jsonError("البريد الإلكتروني مستخدم مسبقًا", 409);

    const scope = await resolveRoleScope(body.role, body.departmentId, body.sectionId);
    const passwordHash = await bcrypt.hash(body.password, 12);

    const created = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        status: "ACTIVE",
        departmentId: scope.departmentId,
        sectionId: scope.sectionId,
      },
      select: userSelect,
    });

    await audit(parseInt(user.id, 10), "CREATE_USER", "User", created.id, {
      email: created.email,
      role: created.role,
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
