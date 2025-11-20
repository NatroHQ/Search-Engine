import { query } from "../client"
import type { SessionMetrics } from "../schema"

export async function saveBehaviorEvents(
  sessionId: string,
  events: Array<{
    type: string
    x?: number
    y?: number
    scrollDepth?: number
    elementSelector?: string
    timestamp: number
  }>,
  pageUrl: string,
  viewport: { width: number; height: number },
): Promise<void> {
  const values = events
    .map(
      (event) =>
        `('${sessionId}', '${pageUrl}', '${event.type}', ${event.x || "NULL"}, ${event.y || "NULL"}, ${event.scrollDepth || "NULL"}, ${event.elementSelector ? `'${event.elementSelector}'` : "NULL"}, ${viewport.width}, ${viewport.height}, ${event.timestamp})`,
    )
    .join(",")

  await query(`
    INSERT INTO user_behaviors (session_id, page_url, event_type, x_position, y_position, scroll_depth, element_selector, viewport_width, viewport_height, timestamp)
    VALUES ${values}
  `)
}

export async function updateSessionMetrics(
  sessionId: string,
  metrics: {
    totalTime: number
    activeTime: number
    idleTime: number
    pagesVisited?: number
    searchesPerformed?: number
    clicksMade?: number
    scrollEvents?: number
    averageScrollDepth?: number
    engagementScore?: number
  },
): Promise<void> {
  const existing = await query<SessionMetrics[]>(
    `
    SELECT * FROM session_metrics WHERE session_id = $1
  `,
    [sessionId],
  )

  if (existing.length === 0) {
    await query(
      `
      INSERT INTO session_metrics (
        session_id, total_time_seconds, active_time_seconds, idle_time_seconds,
        pages_visited, searches_performed, clicks_made, scroll_events,
        average_scroll_depth, engagement_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        sessionId,
        metrics.totalTime,
        metrics.activeTime,
        metrics.idleTime,
        metrics.pagesVisited || 1,
        metrics.searchesPerformed || 0,
        metrics.clicksMade || 0,
        metrics.scrollEvents || 0,
        metrics.averageScrollDepth || 0,
        metrics.engagementScore || 0,
      ],
    )
  } else {
    await query(
      `
      UPDATE session_metrics SET
        total_time_seconds = total_time_seconds + $2,
        active_time_seconds = active_time_seconds + $3,
        idle_time_seconds = idle_time_seconds + $4,
        pages_visited = COALESCE($5, pages_visited),
        searches_performed = COALESCE($6, searches_performed),
        clicks_made = COALESCE($7, clicks_made),
        scroll_events = COALESCE($8, scroll_events),
        average_scroll_depth = COALESCE($9, average_scroll_depth),
        engagement_score = COALESCE($10, engagement_score),
        last_activity_at = NOW(),
        updated_at = NOW()
      WHERE session_id = $1
    `,
      [
        sessionId,
        metrics.totalTime,
        metrics.activeTime,
        metrics.idleTime,
        metrics.pagesVisited,
        metrics.searchesPerformed,
        metrics.clicksMade,
        metrics.scrollEvents,
        metrics.averageScrollDepth,
        metrics.engagementScore,
      ],
    )
  }
}

export async function saveJourneyStep(
  sessionId: string,
  step: {
    stepNumber: number
    pageUrl: string
    pageTitle: string
    referrerUrl: string
    actionType: string
    actionDetails: Record<string, unknown>
    timeOnPage: number
  },
): Promise<void> {
  await query(
    `
    INSERT INTO user_journeys (
      session_id, step_number, page_url, page_title, referrer_url,
      action_type, action_details, time_on_page_seconds
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
    [
      sessionId,
      step.stepNumber,
      step.pageUrl,
      step.pageTitle,
      step.referrerUrl,
      step.actionType,
      JSON.stringify(step.actionDetails),
      step.timeOnPage,
    ],
  )
}

export async function saveBehaviorInsight(
  sessionId: string,
  insight: {
    analysisType: string
    insights: Record<string, unknown>
    qualityScore: number
    intentPrediction: string
    userSegment: string
    anomalyDetected: boolean
    confidenceScore: number
  },
): Promise<void> {
  await query(
    `
    INSERT INTO behavior_insights (
      session_id, analysis_type, insights, quality_score,
      intent_prediction, user_segment, anomaly_detected, confidence_score
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
    [
      sessionId,
      insight.analysisType,
      JSON.stringify(insight.insights),
      insight.qualityScore,
      insight.intentPrediction,
      insight.userSegment,
      insight.anomalyDetected,
      insight.confidenceScore,
    ],
  )
}

export async function updateHeatmap(
  pageUrl: string,
  x: number,
  y: number,
  eventType: "click" | "hover",
  viewport: { width: number; height: number },
): Promise<void> {
  const bucketSize = 50
  const xBucket = Math.floor(x / bucketSize)
  const yBucket = Math.floor(y / bucketSize)

  const field = eventType === "click" ? "click_count" : "hover_count"

  await query(
    `
    INSERT INTO heatmap_data (page_url, x_bucket, y_bucket, ${field}, viewport_width, viewport_height)
    VALUES ($1, $2, $3, 1, $4, $5)
    ON CONFLICT (page_url, x_bucket, y_bucket, viewport_width, viewport_height)
    DO UPDATE SET ${field} = heatmap_data.${field} + 1, last_updated_at = NOW()
  `,
    [pageUrl, xBucket, yBucket, viewport.width, viewport.height],
  )
}
