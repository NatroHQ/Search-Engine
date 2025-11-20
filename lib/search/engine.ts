import { query } from "../database/client"
import type { IndexedPage } from "../schema"
import type { SearchResult, SearchOptions, SearchResponse } from "./types"
import { calculateRelevanceScore } from "./ranker"
import { highlightText, generateSnippet } from "./highlighter"
import { generateSuggestions } from "./suggestions"

export class SearchEngine {
  async search(searchQuery: string, options: Partial<SearchOptions> = {}): Promise<SearchResponse> {
    const startTime = Date.now()

    const opts: SearchOptions = {
      page: options.page || 1,
      perPage: options.perPage || 20,
      language: options.language,
      domain: options.domain,
      sortBy: options.sortBy || "relevance",
      contentType: options.contentType,
    }

    const offset = (opts.page - 1) * opts.perPage

    const keywords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2)

    const tsQuery = keywords
      .map((term) => term.replace(/[^\w]/g, ""))
      .filter((term) => term.length > 0)
      .join(" & ")

    if (!tsQuery) {
      return {
        results: [],
        totalResults: 0,
        page: opts.page,
        perPage: opts.perPage,
        totalPages: 0,
        query: searchQuery,
        processingTime: Date.now() - startTime,
      }
    }

    let whereClause = `WHERE status = 'active' 
      AND (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')) 
           @@ to_tsquery('english', $1))`

    const params: any[] = [tsQuery]
    let paramIndex = 2

    if (opts.contentType) {
      whereClause += ` AND content_type = $${paramIndex}`
      params.push(opts.contentType)
      paramIndex++
    }

    if (opts.language) {
      whereClause += ` AND language = $${paramIndex}`
      params.push(opts.language)
      paramIndex++
    }

    if (opts.domain) {
      whereClause += ` AND domain = $${paramIndex}`
      params.push(opts.domain)
      paramIndex++
    }

    let orderClause = "ORDER BY rank DESC, page_rank DESC, last_indexed_at DESC"
    if (opts.contentType === "news") {
      orderClause = "ORDER BY published_date DESC NULLS LAST, rank DESC, page_rank DESC"
    }

    const pages = await query<IndexedPage & { rank: number }>(
      `SELECT *, 
         ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')), 
                 to_tsquery('english', $1)) as rank
       FROM indexed_pages
       ${whereClause}
       ${orderClause}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, opts.perPage * 3, offset],
    )

    const scoredResults = pages
      .map((page) => {
        const relevanceScore = calculateRelevanceScore(page, searchQuery, keywords)

        const snippet = generateSnippet(page.content || "", searchQuery, 200)
        const highlightedTitle = highlightText(page.title || "", searchQuery)
        const highlightedSnippet = highlightText(snippet, searchQuery)

        return {
          id: page.id,
          url: page.url,
          title: page.title || "Untitled",
          description: page.description || "",
          content: page.content || "",
          domain: page.domain || "",
          favicon: page.favicon_url || "",
          score: relevanceScore,
          snippet,
          highlightedTitle,
          highlightedSnippet,
          contentType: page.content_type,
          imageUrl: page.image_url,
          videoUrl: page.video_url,
          thumbnailUrl: page.thumbnail_url,
          publishedDate: page.published_date,
          author: page.author,
        } as SearchResult
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.perPage)

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM indexed_pages
       ${whereClause}`,
      params,
    )

    const totalResults = Number.parseInt(countResult[0]?.count || "0", 10)
    const totalPages = Math.ceil(totalResults / opts.perPage)

    const suggestions = await generateSuggestions(searchQuery, 5)

    const processingTime = Date.now() - startTime

    return {
      results: scoredResults,
      totalResults,
      page: opts.page,
      perPage: opts.perPage,
      totalPages,
      query: searchQuery,
      processingTime,
      suggestions,
    }
  }

  async searchByKeyword(keyword: string, limit = 20): Promise<SearchResult[]> {
    const pages = await query<IndexedPage & { relevance_score: number }>(
      `SELECT p.*, pk.relevance_score
       FROM indexed_pages p
       JOIN page_keywords pk ON p.id = pk.page_id
       WHERE pk.keyword = $1 AND p.status = 'active'
       ORDER BY pk.relevance_score DESC, p.page_rank DESC
       LIMIT $2`,
      [keyword.toLowerCase(), limit],
    )

    return pages.map((page) => ({
      id: page.id,
      url: page.url,
      title: page.title || "Untitled",
      description: page.description || "",
      content: page.content || "",
      domain: page.domain || "",
      favicon: page.favicon_url || "",
      score: page.relevance_score,
      snippet: generateSnippet(page.content || "", keyword, 200),
      highlightedTitle: highlightText(page.title || "", keyword),
      highlightedSnippet: highlightText(page.description || "", keyword),
    }))
  }
}
