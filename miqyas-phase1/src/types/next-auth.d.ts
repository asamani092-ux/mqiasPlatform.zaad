import "next-auth";
import "next-auth/jwt";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      uid: string;
      name: string;
      email: string;
      role: Role;
      departmentId: number | null;
      sectionId: number | null;
    };
  }

  interface User {
    role: Role;
    departmentId: number | null;
    sectionId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    departmentId?: number | null;
    sectionId?: number | null;
  }
}
