import type { NextAuthOptions, Session } from "next-auth";
import type { Role } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";

function extractClientIp(req: { headers?: Record<string, unknown> } | undefined): string | undefined {
  if (!req?.headers) return undefined;
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? String(forwarded[0]) : String(forwarded);
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) return Array.isArray(realIp) ? String(realIp[0]) : String(realIp);
  return undefined;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
        rememberMe: { label: "تذكرني", type: "text" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        const rememberMe = credentials?.rememberMe === "true";
        const ip = extractClientIp(req);

        if (!email || !password) return null;

        // قفل مؤقت: 5 محاولات فاشلة خلال 15 دقيقة
        const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
        const LOCKOUT_MAX_FAILURES = 5;
        const recentFailures = await db.loginAttempt.count({
          where: {
            email,
            success: false,
            createdAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
          },
        });
        if (recentFailures >= LOCKOUT_MAX_FAILURES) {
          await db.loginAttempt.create({
            data: { email, success: false, ip },
          });
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        let success = false;

        if (user && user.status === "ACTIVE") {
          success = await bcrypt.compare(password, user.passwordHash);
        }

        await db.loginAttempt.create({
          data: {
            email,
            success,
            userId: user?.id,
            ip,
          },
        });

        if (!success || !user) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        await audit(user.id, "LOGIN", "User", user.id, ip ? { ip } : undefined, ip);

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          sectionId: user.sectionId,
          rememberMe,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const THIRTY_DAYS = 30 * 24 * 60 * 60;
      const EIGHT_HOURS = 8 * 60 * 60;

      if (user) {
        const u = user as {
          id: string;
          role: Role;
          departmentId: number | null;
          sectionId: number | null;
          rememberMe?: boolean;
        };
        token.uid = u.id;
        token.role = u.role;
        token.departmentId = u.departmentId;
        token.sectionId = u.sectionId;
        if (u.rememberMe) {
          token.rememberMe = true;
          token.exp = Math.floor(Date.now() / 1000) + THIRTY_DAYS;
        } else {
          token.exp = Math.floor(Date.now() / 1000) + EIGHT_HOURS;
        }
      } else if (token.rememberMe) {
        token.exp = Math.floor(Date.now() / 1000) + THIRTY_DAYS;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.uid = token.uid as string;
        session.user.role = token.role as Role;
        session.user.departmentId = (token.departmentId as number | null) ?? null;
        session.user.sectionId = (token.sectionId as number | null) ?? null;
      }
      return session;
    },
  },
};

export type AuthError = { status: 401; message: string };

function sessionToUser(session: Session | null): SessionUser | null {
  const u = session?.user;
  if (!u?.uid) return null;
  return {
    id: u.uid,
    name: u.name ?? "",
    email: u.email ?? "",
    role: u.role,
    departmentId: u.departmentId ?? null,
    sectionId: u.sectionId ?? null,
  };
}

/**
 * إعادة تحقق من قاعدة البيانات: الحساب ما زال نشطًا، والدور/النطاق محدّثان.
 * تعطيل الحساب أو تغيير الدور يسري فورًا دون انتظار انتهاء JWT.
 */
async function revalidateFromDb(user: SessionUser): Promise<SessionUser | null> {
  const dbUser = await db.user.findUnique({
    where: { id: parseInt(user.id, 10) },
    select: { status: true, role: true, departmentId: true, sectionId: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE") return null;
  return {
    ...user,
    role: dbUser.role,
    departmentId: dbUser.departmentId,
    sectionId: dbUser.sectionId,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  const user = sessionToUser(session);
  const fresh = user ? await revalidateFromDb(user) : null;
  if (!fresh) {
    const err = { status: 401 as const, message: "غير مصرح" };
    throw err;
  }
  return fresh;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = sessionToUser(session);
  return user ? revalidateFromDb(user) : null;
}
