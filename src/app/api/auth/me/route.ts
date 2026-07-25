import { NextResponse } from "next/server";

/**
 * Static route that shadows the NextAuth catch-all for `/api/auth/me`.
 * External tooling polls this path; NextAuth answered with a 400 after
 * booting its whole handler. Answering here keeps the dev server idle.
 */
export function GET() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export const POST = GET;
