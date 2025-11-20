import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, demoMode: true })
    }

    const { sessionId, events, metrics } = await request.json()

    if (!sessionId || !events || !metrics) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Dynamic import with error handling
    try {
      const { saveBehaviorEvents, updateSessionMetrics } = await import("@/lib/database/repositories/behavior")

      // Save behavior events
      await saveBehaviorEvents(sessionId, events, metrics.url, metrics.viewport)

      // Update session metrics
      const idleTime = metrics.totalTime - metrics.activeTime
      await updateSessionMetrics(sessionId, {
        totalTime: metrics.totalTime,
        activeTime: metrics.activeTime,
        idleTime,
      })

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error("[v0] Behavior tracking database error:", dbError)
      return NextResponse.json({ success: true, demoMode: true })
    }
  } catch (error) {
    console.error("[v0] Behavior tracking error:", error)
    return NextResponse.json({ success: true })
  }
}
