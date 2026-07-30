import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

const ENTRY_ROLES: Role[] = ["EMPLOYEE", "SECTION_HEAD", "DEPT_MANAGER"];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as Role | undefined;
    const myUrl = new URL("/my", req.url);
    const dash = new URL("/dashboard", req.url);

    if (!role) return NextResponse.redirect(new URL("/login", req.url));

    if (ENTRY_ROLES.includes(role)) {
      if (path.startsWith("/approvals") || path.startsWith("/api/approvals")) {
        // الاعتماد النهائي لمشرف النظام فقط
        return NextResponse.redirect(myUrl);
      }
      if (
        path.startsWith("/dashboard") ||
        path.startsWith("/strategic") ||
        path.startsWith("/operational") ||
        path.startsWith("/early-warning") ||
        path.startsWith("/deviation") ||
        path.startsWith("/governance") ||
        path.startsWith("/knowledge") ||
        path.startsWith("/executive") ||
        path.startsWith("/admin") ||
        path.startsWith("/uat")
      ) {
        if (role === "DEPT_MANAGER" && path.startsWith("/dept-follow")) {
          return NextResponse.next();
        }
        return NextResponse.redirect(myUrl);
      }
      if (path === "/" || path === "") {
        return NextResponse.redirect(myUrl);
      }
      return NextResponse.next();
    }

    if (path.startsWith("/admin") && role !== "SYSTEM_ADMIN") {
      return NextResponse.redirect(dash);
    }

    if (
      path.startsWith("/executive") &&
      role !== "SYSTEM_ADMIN" &&
      role !== "EXECUTIVE"
    ) {
      return NextResponse.redirect(dash);
    }

    if (path.startsWith("/dept-follow") && role !== "SYSTEM_ADMIN" && role !== "DEPT_MANAGER") {
      return NextResponse.redirect(dash);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|forgot-password|reset-password|api/|_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
