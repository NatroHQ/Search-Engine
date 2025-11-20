import { type NextRequest, NextResponse } from "next/server"
import { getSearchAnalytics } from "@/lib/database/repositories/analytics"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = Number.parseInt(searchParams.get("days") || "7", 10)

    const stats = await getSearchAnalytics(Math.min(days, 90))

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Analytics stats error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
