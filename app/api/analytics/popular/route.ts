import { type NextRequest, NextResponse } from "next/server"
import { getPopularSearches } from "@/lib/database/repositories/analytics"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    const popularSearches = await getPopularSearches(Math.min(limit, 50))

    return NextResponse.json({
      success: true,
      data: popularSearches,
    })
  } catch (error) {
    console.error("Popular searches error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
