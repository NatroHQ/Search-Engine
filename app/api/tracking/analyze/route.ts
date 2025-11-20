import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: "Database not configured",
      })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    // Dynamic import with error handling
    try {
      const { query } = await import("@/lib/database/client")
      const { analyzeBehaviorWithLLM } = await import("@/lib/ai/behavior-analyzer")
      const { saveBehaviorInsight } = await import("@/lib/database/repositories/behavior")
      const { awardTokens } = await import("@/lib/database/repositories/tokens")

      // Get behavior events
      const events = await query(
        `
        SELECT event_type as type, timestamp, 
               jsonb_build_object('x', x_position, 'y', y_position, 'scrollDepth', scroll_depth) as data
        FROM user_behaviors
        WHERE session_id = $1
        ORDER BY timestamp DESC
        LIMIT 100
      `,
        [sessionId],
      )

      // Get session metrics
      const metricsResult = await query(
        `
        SELECT * FROM session_metrics WHERE session_id = $1
      `,
        [sessionId],
      )

      const metrics = metricsResult[0] || {
        total_time_seconds: 0,
        active_time_seconds: 0,
        searches_performed: 0,
        clicks_made: 0,
        pages_visited: 0,
      }

      // Get journey steps
      const journeySteps = await query(
        `
        SELECT action_type as action, action_details as details
        FROM user_journeys
        WHERE session_id = $1
        ORDER BY step_number
      `,
        [sessionId],
      )

      // Analyze with LLM
      const analysis = await analyzeBehaviorWithLLM({
        sessionId,
        events: events as any,
        metrics: {
          totalTime: metrics.total_time_seconds,
          activeTime: metrics.active_time_seconds,
          searchesPerformed: metrics.searches_performed,
          clicksMade: metrics.clicks_made,
          pagesVisited: metrics.pages_visited,
        },
        journeySteps: journeySteps as any,
      })

      // Save insights
      await saveBehaviorInsight(sessionId, {
        analysisType: "quality",
        insights: analysis.insights,
        qualityScore: analysis.qualityScore,
        intentPrediction: analysis.intentPrediction,
        userSegment: analysis.userSegment,
        anomalyDetected: analysis.anomalyDetected,
        confidenceScore: analysis.confidence,
      })

      // Award tokens based on quality
      if (analysis.insights.recommendedTokens > 0 && !analysis.anomalyDetected) {
        await awardTokens(sessionId, analysis.insights.recommendedTokens, "behavior_quality", {
          qualityScore: analysis.qualityScore,
          engagementLevel: analysis.engagementLevel,
        })
      }

      return NextResponse.json({
        success: true,
        analysis,
      })
    } catch (dbError) {
      console.error("[v0] Behavior analysis error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Analysis failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Behavior analysis error:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze behavior" }, { status: 500 })
  }
}
