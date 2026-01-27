// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { routes } from "@/constants/routes";

// Public routes and assets that don't require auth
const PUBLIC_PATHS = [
  routes.backofficeLogin,
  routes.register,
  routes.home,
  routes.subscriptions,
  '/logout',
  '/_next/',
  '/icons/',
  '/images/',
  '/workbox-',
  '/fallback',
  '/manifest.json',
  '/offline.html',
  '/sw.js',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip for public routes, static assets, PWA files, API routes
  if (
    PUBLIC_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/pos') // Skip POS routes as you had
  ) {
    return NextResponse.next();
  }

  // 2. Get session_id from HttpOnly cookie (set by server on login)
  const sessionId = request.cookies.get('session_id')?.value;

  if (!sessionId) {
    // No session → redirect to login
    const loginUrl = new URL(routes.backofficeLogin, request.url);
    // Optional: redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: Quick validation of session (recommended for production)
  // If you want extra safety, call your backend to verify session
  // try {
  //   const response = await fetch(`${process.env.API_URL}/validate-session`, {
  //     headers: { 'Cookie': `session_id=${sessionId}` },
  //   });
  //   if (!response.ok) throw new Error('Invalid session');
  // } catch {
  //   return NextResponse.redirect(new URL(routes.backofficeLogin, request.url));
  // }

  // Session exists → allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/backoffice/:path*",
    "/sales/:path*",
    "/production/:path*",
    // Add other protected paths as needed
  ],
};