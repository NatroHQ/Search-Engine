import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, demoMode: true })
    }

    const data = await request.json()

    if (!data.sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    // Dynamic import with error handling
    try {
      const { saveJourneyStep } = await import("@/lib/database/repositories/behavior")

      await saveJourneyStep(data.sessionId, {
        stepNumber: data.stepNumber,
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle,
        referrerUrl: data.referrer,
        actionType: data.actionType,
        actionDetails: data.actionDetails,
        timeOnPage: data.timeOnPage,
      })

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error("[v0] Journey tracking database error:", dbError)
      return NextResponse.json({ success: true, demoMode: true })
    }
  } catch (error) {
    console.error("[v0] Journey tracking error:", error)
    return NextResponse.json({ success: true })
  }
}
