import type { NextAuthOptions, Session } from "next-auth";
import type { Role } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
        const failedCount = await db.loginAttempt.count({
          where: { email, success: false, createdAt: { gte: fifteenMinAgo } },
        });

        if (failedCount >= 5) {
          throw new Error("تم تجاوز عدد المحاولات، حاول بعد 15 دقيقة");
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
          },
        });

        if (!success || !user) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        await audit(user.id, "LOGIN", "User", user.id);

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          sectionId: user.sectionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: Role;
          departmentId: number | null;
          sectionId: number | null;
        };
        token.uid = u.id;
        token.role = u.role;
        token.departmentId = u.departmentId;
        token.sectionId = u.sectionId;
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

export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  const user = sessionToUser(session);
  if (!user) {
    const err = { status: 401 as const, message: "غير مصرح" };
    throw err;
  }
  return user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return sessionToUser(session);
}
