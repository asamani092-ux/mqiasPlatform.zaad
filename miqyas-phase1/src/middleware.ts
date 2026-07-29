import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;
    const dash = new URL("/dashboard", req.url);

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

    if (
      (path.startsWith("/strategic") || path.startsWith("/governance")) &&
      role !== "SYSTEM_ADMIN" &&
      role !== "EXECUTIVE"
    ) {
      return NextResponse.redirect(dash);
    }

    if (
      path.startsWith("/knowledge") &&
      role !== "SYSTEM_ADMIN" &&
      role !== "EXECUTIVE" &&
      role !== "DEPT_MANAGER"
    ) {
      return NextResponse.redirect(dash);
    }

    if (
      (path.startsWith("/operational") ||
        path.startsWith("/early-warning") ||
        path.startsWith("/deviation")) &&
      role === "EMPLOYEE"
    ) {
      return NextResponse.redirect(dash);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/((?!login|forgot-password|reset-password|api/auth|api/cron|_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
