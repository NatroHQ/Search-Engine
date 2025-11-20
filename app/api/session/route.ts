import { type NextRequest, NextResponse } from "next/server"
import { createOrUpdateSession } from "@/lib/database/repositories/analytics"
import { headers } from "next/headers"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { consent_given = false } = body

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    const existingSessionId = request.cookies.get("natro_session")?.value
    const sessionId = existingSessionId || randomBytes(32).toString("hex")

    const session = await createOrUpdateSession({
      session_id: sessionId,
      ip_address: ipAddress,
      user_agent: userAgent,
      consent_given,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        session_id: sessionId,
        consent_given: session.consent_given,
      },
    })

    if (!existingSessionId) {
      response.cookies.set("natro_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    return response
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
