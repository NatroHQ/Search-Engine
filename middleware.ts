import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { rateLimit } from "@/lib/utils/rate-limiter"

export function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const allowed = rateLimit(ip, 100, 60000)

    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
