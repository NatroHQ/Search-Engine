import { type NextRequest, NextResponse } from "next/server"
import { generateSuggestions } from "@/lib/search/suggestions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || searchParams.get("query")
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: {
          query,
          suggestions: [],
        },
      })
    }

    const suggestions = await generateSuggestions(query, Math.min(limit, 10))

    return NextResponse.json({
      success: true,
      data: {
        query,
        suggestions,
      },
    })
  } catch (error) {
    console.error("[v0] Suggestions error:", error)
    return NextResponse.json({
      success: true,
      data: {
        query: request.nextUrl.searchParams.get("q") || "",
        suggestions: [],
      },
    })
  }
}
