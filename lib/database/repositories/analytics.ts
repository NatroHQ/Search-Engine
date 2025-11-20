import { query } from "../client"
import type { UserSession, SearchQuery, SearchClick, PopularSearch } from "../schema"

export async function createOrUpdateSession(data: {
  session_id: string
  ip_address?: string
  user_agent?: string
  country?: string
  city?: string
  consent_given?: boolean
}): Promise<UserSession> {
  const result = await query<UserSession>(
    `INSERT INTO user_sessions 
     (session_id, ip_address, user_agent, country, city, consent_given)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (session_id) 
     DO UPDATE SET 
       last_seen_at = NOW(),
       consent_given = COALESCE(EXCLUDED.consent_given, user_sessions.consent_given)
     RETURNING *`,
    [
      data.session_id,
      data.ip_address || null,
      data.user_agent || null,
      data.country || null,
      data.city || null,
      data.consent_given || false,
    ],
  )
  return result[0]
}

export async function logSearchQuery(data: {
  session_id?: string
  query: string
  results_count: number
  page_number: number
  response_time_ms?: number
  ip_address?: string
  user_agent?: string
}): Promise<SearchQuery> {
  const result = await query<SearchQuery>(
    `INSERT INTO search_queries 
     (session_id, query, results_count, page_number, response_time_ms, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.session_id || null,
      data.query,
      data.results_count,
      data.page_number,
      data.response_time_ms || null,
      data.ip_address || null,
      data.user_agent || null,
    ],
  )

  await query(
    `INSERT INTO popular_searches (query, search_count, last_searched_at)
     VALUES ($1, 1, NOW())
     ON CONFLICT (query)
     DO UPDATE SET
       search_count = popular_searches.search_count + 1,
       last_searched_at = NOW()`,
    [data.query],
  )

  return result[0]
}

export async function logSearchClick(data: {
  query_id: string
  page_id?: string
  clicked_url: string
  position?: number
}): Promise<SearchClick> {
  const result = await query<SearchClick>(
    `INSERT INTO search_clicks (query_id, page_id, clicked_url, position)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.query_id, data.page_id || null, data.clicked_url, data.position || null],
  )
  return result[0]
}

export async function getPopularSearches(limit = 10): Promise<PopularSearch[]> {
  return query<PopularSearch>(
    `SELECT * FROM popular_searches 
     ORDER BY search_count DESC 
     LIMIT $1`,
    [limit],
  )
}

export async function getSearchAnalytics(days = 7) {
  const queriesPerDay = await query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM search_queries
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
  )

  const totalQueries = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM search_queries
     WHERE created_at >= NOW() - INTERVAL '${days} days'`,
  )

  const avgResponseTime = await query<{ avg: string }>(
    `SELECT AVG(response_time_ms) as avg FROM search_queries
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     AND response_time_ms IS NOT NULL`,
  )

  return {
    queriesPerDay,
    totalQueries: Number.parseInt(totalQueries[0]?.count || "0", 10),
    avgResponseTime: Number.parseFloat(avgResponseTime[0]?.avg || "0"),
  }
}
