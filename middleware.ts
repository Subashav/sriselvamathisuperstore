import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const securePaths = ["/api", "/admin", "/checkout"];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  const isProduction = process.env.NODE_ENV === "production";
  const isSecurePath = securePaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isForwardedHttps = request.headers.get("x-forwarded-proto") === "https";

  if (isProduction && isSecurePath && !isForwardedHttps) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
