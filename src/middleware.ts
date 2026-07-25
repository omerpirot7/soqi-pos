import createMiddleware from "next-intl/middleware";
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const authMiddleware = withAuth(
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname.includes("/login")) return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/ckb/login",
    },
  }
);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // External tools poll this path constantly. Answer here on the edge so
  // it never wakes Turbopack / the Node server and starves page navigations.
  if (pathname === "/api/auth/me" || pathname === "/api/auth/me/") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.includes("/login")) {
    return intlMiddleware(req);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (authMiddleware as any)(req, {} as never);
}

export const config = {
  matcher: ["/api/auth/me", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
