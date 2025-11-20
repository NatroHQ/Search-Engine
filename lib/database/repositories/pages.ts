import { query, transaction } from "../client"
import type { IndexedPage } from "../schema"

export async function insertPage(page: {
  url: string
  title?: string
  description?: string
  content?: string
  language?: string
  favicon_url?: string
  domain?: string
  path?: string
  page_rank?: number
  word_count?: number
  content_type?: "web" | "news" | "video" | "image"
  published_date?: Date | null
  author?: string | null
  image_url?: string | null
  video_url?: string | null
  video_duration?: number | null
  image_width?: number | null
  image_height?: number | null
  thumbnail_url?: string | null
  category?: string | null
  ai_summary?: string | null
  ai_tags?: string[] | null
}): Promise<IndexedPage> {
  const result = await query<IndexedPage>(
    `INSERT INTO indexed_pages 
    (url, title, description, content, language, favicon_url, domain, path, page_rank, word_count,
     content_type, published_date, author, image_url, video_url, video_duration, 
     image_width, image_height, thumbnail_url, category, ai_summary, ai_tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    ON CONFLICT (url) 
    DO UPDATE SET 
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      content = EXCLUDED.content,
      language = EXCLUDED.language,
      favicon_url = EXCLUDED.favicon_url,
      last_indexed_at = NOW(),
      page_rank = EXCLUDED.page_rank,
      word_count = EXCLUDED.word_count,
      content_type = EXCLUDED.content_type,
      published_date = EXCLUDED.published_date,
      author = EXCLUDED.author,
      image_url = EXCLUDED.image_url,
      video_url = EXCLUDED.video_url,
      video_duration = EXCLUDED.video_duration,
      image_width = EXCLUDED.image_width,
      image_height = EXCLUDED.image_height,
      thumbnail_url = EXCLUDED.thumbnail_url,
      category = EXCLUDED.category,
      ai_summary = EXCLUDED.ai_summary,
      ai_tags = EXCLUDED.ai_tags,
      updated_at = NOW()
    RETURNING *`,
    [
      page.url,
      page.title || null,
      page.description || null,
      page.content || null,
      page.language || "en",
      page.favicon_url || null,
      page.domain || null,
      page.path || null,
      page.page_rank || 0.0,
      page.word_count || 0,
      page.content_type || "web",
      page.published_date || null,
      page.author || null,
      page.image_url || null,
      page.video_url || null,
      page.video_duration || null,
      page.image_width || null,
      page.image_height || null,
      page.thumbnail_url || null,
      page.category || null,
      page.ai_summary || null,
      page.ai_tags || null,
    ],
  )
  return result[0]
}

export async function getPageByUrl(url: string): Promise<IndexedPage | null> {
  const result = await query<IndexedPage>("SELECT * FROM indexed_pages WHERE url = $1", [url])
  return result[0] || null
}

export async function insertPageKeywords(
  pageId: string,
  keywords: { keyword: string; frequency: number; relevance_score: number }[],
): Promise<void> {
  if (keywords.length === 0) return

  await transaction(async (client) => {
    await client.query("DELETE FROM page_keywords WHERE page_id = $1", [pageId])

    const values = keywords.map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`).join(", ")

    const params = [pageId, ...keywords.flatMap((k) => [k.keyword, k.frequency, k.relevance_score])]

    await client.query(
      `INSERT INTO page_keywords (page_id, keyword, frequency, relevance_score) VALUES ${values}`,
      params,
    )
  })
}

export async function insertPageLinks(
  pageId: string,
  links: { target_url: string; anchor_text?: string; link_type: "internal" | "external" }[],
): Promise<void> {
  if (links.length === 0) return

  const values = links.map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`).join(", ")

  const params = [pageId, ...links.flatMap((l) => [l.target_url, l.anchor_text || null, l.link_type])]

  await query(
    `INSERT INTO page_links (source_page_id, target_url, anchor_text, link_type) 
     VALUES ${values}
     ON CONFLICT DO NOTHING`,
    params,
  )
}

export async function searchPages(
  searchQuery: string,
  limit = 20,
  offset = 0,
  contentType?: "web" | "news" | "video" | "image",
): Promise<{ pages: IndexedPage[]; total: number }> {
  const tsQuery = searchQuery
    .split(/\s+/)
    .map((term) => term.replace(/[^\w]/g, ""))
    .filter((term) => term.length > 0)
    .join(" & ")

  const contentTypeFilter = contentType ? "AND content_type = $4" : ""
  const params = contentType ? [tsQuery, limit, offset, contentType] : [tsQuery, limit, offset]

  const pages = await query<IndexedPage>(
    `SELECT *, 
       ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')), 
               to_tsquery('english', $1)) as rank
     FROM indexed_pages
     WHERE status = 'active'
       AND (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')) @@ to_tsquery('english', $1))
       ${contentTypeFilter}
     ORDER BY rank DESC, page_rank DESC
     LIMIT $2 OFFSET $3`,
    params,
  )

  const countParams = contentType ? [tsQuery, contentType] : [tsQuery]
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM indexed_pages
     WHERE status = 'active'
       AND (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')) @@ to_tsquery('english', $1))
       ${contentTypeFilter.replace("$4", "$2")}`,
    countParams,
  )

  return {
    pages,
    total: Number.parseInt(countResult[0]?.count || "0", 10),
  }
}
