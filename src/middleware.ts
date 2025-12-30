import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Admin authentication
const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "your-secret-key-change-in-production",
);
const ADMIN_COOKIE_NAME = "admin_session";

// Tester authentication
const USER_JWT_SECRET = new TextEncoder().encode(
  process.env.USER_JWT_SECRET || "user-session-secret-change-me",
);
const USER_COOKIE_NAME = "user_session";

// Admin routes
const ADMIN_PROTECTED_ROUTES = ["/admin"];
const ADMIN_AUTH_ROUTES = ["/admin/login"];

// Tester routes that require authentication
const TESTER_PROTECTED_ROUTES = [
  "/dashboard",
  "/sessions",
  "/profile",
  "/teams",
];
// Tester auth routes (should redirect to dashboard if already authenticated)
const TESTER_AUTH_ROUTES = ["/login", "/signup", "/reset-password"];

// Public routes (no auth required)
const PUBLIC_ROUTES = ["/", "/join"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === ADMIN ROUTE HANDLING ===
  const isAdminProtectedRoute = ADMIN_PROTECTED_ROUTES.some(
    (route) =>
      pathname.startsWith(route) && !pathname.startsWith("/admin/login"),
  );
  const isAdminAuthRoute = ADMIN_AUTH_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isAdminProtectedRoute || isAdminAuthRoute) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    let isAdminAuthenticated = false;

    if (adminToken) {
      try {
        await jwtVerify(adminToken, ADMIN_JWT_SECRET);
        isAdminAuthenticated = true;
      } catch {
        isAdminAuthenticated = false;
      }
    }

    // Unauthenticated access to protected admin route -> redirect to admin login
    if (isAdminProtectedRoute && !isAdminAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated access to admin auth route -> redirect to admin dashboard
    if (isAdminAuthRoute && isAdminAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // === TESTER ROUTE HANDLING ===
  const isTesterProtectedRoute = TESTER_PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isTesterAuthRoute = TESTER_AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (isTesterProtectedRoute || isTesterAuthRoute) {
    const userToken = request.cookies.get(USER_COOKIE_NAME)?.value;
    let isUserAuthenticated = false;

    if (userToken) {
      try {
        await jwtVerify(userToken, USER_JWT_SECRET);
        isUserAuthenticated = true;
      } catch {
        isUserAuthenticated = false;
      }
    }

    // Unauthenticated access to protected tester route -> redirect to login
    if (isTesterProtectedRoute && !isUserAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated access to tester auth route -> redirect to dashboard
    if (isTesterAuthRoute && isUserAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // === PUBLIC ROUTES - no authentication required ===
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",
    // Tester protected routes - need both exact and subpath matches
    "/dashboard",
    "/dashboard/:path*",
    "/sessions",
    "/sessions/:path*",
    "/profile",
    "/profile/:path*",
    "/teams",
    "/teams/:path*",
    // Auth routes
    "/login",
    "/login/:path*",
    "/signup",
    "/signup/:path*",
    "/reset-password",
    "/reset-password/:path*",
    // Note: /report routes are intentionally excluded to allow public access to shared reports
  ],
};
