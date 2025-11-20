import { type NextRequest, NextResponse } from "next/server"
import { SearchEngine } from "@/lib/search/engine"
import { logSearchQuery } from "@/lib/database/repositories/analytics"
import { headers } from "next/headers"
import { rewardTokens } from "@/lib/utils/token-rewards"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || searchParams.get("query")
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const perPage = Number.parseInt(searchParams.get("per_page") || "20", 10)
    const language = searchParams.get("language") || undefined
    const domain = searchParams.get("domain") || undefined
    const contentType = searchParams.get("type") as "web" | "news" | "video" | "image" | undefined

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    if (query.length > 500) {
      return NextResponse.json({ error: "Search query too long" }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          totalResults: 0,
          page: 1,
          totalPages: 0,
          query,
          processingTime: Date.now() - startTime,
          demoMode: true,
        },
      })
    }

    const engine = new SearchEngine()
    const results = await engine.search(query, {
      page,
      perPage: Math.min(perPage, 100),
      language,
      domain,
      contentType,
    })

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"
    const sessionId = request.cookies.get("natro_session")?.value

    try {
      await logSearchQuery({
        query,
        results_count: results.totalResults,
        page_number: page,
        response_time_ms: Date.now() - startTime,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

      if (sessionId) {
        await rewardTokens(sessionId, "search", { query, results_count: results.totalResults })
      }
    } catch (dbError) {
      console.error("[v0] Database logging failed:", dbError)
      // Continue even if logging fails
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
