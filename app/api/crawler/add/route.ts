import { type NextRequest, NextResponse } from "next/server"
import { addUrlToQueue } from "@/lib/database/repositories/crawler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, priority = 5, depth = 0 } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const result = await addUrlToQueue(url, priority, depth)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Add URL error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
