import { type NextRequest, NextResponse } from "next/server"
import { logSearchClick } from "@/lib/database/repositories/analytics"
import { rewardTokens } from "@/lib/utils/token-rewards"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query_id, page_id, clicked_url, position } = body

    if (!query_id || !clicked_url) {
      return NextResponse.json({ error: "query_id and clicked_url are required" }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        demoMode: true,
      })
    }

    const sessionId = request.cookies.get("natro_session")?.value

    try {
      await logSearchClick({
        query_id,
        page_id: page_id || undefined,
        clicked_url,
        position: position || undefined,
      })

      if (sessionId) {
        await rewardTokens(sessionId, "click", { clicked_url, position })
      }
    } catch (dbError) {
      console.error("[v0] Click tracking failed:", dbError)
      // Continue even if tracking fails
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("[v0] Click tracking error:", error)
    return NextResponse.json({
      success: true, // Return success to not break user flow
    })
  }
}
