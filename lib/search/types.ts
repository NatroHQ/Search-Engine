export interface SearchResult {
  id: string
  url: string
  title: string
  description: string
  content: string
  domain: string
  favicon: string
  score: number
  snippet: string
  highlightedTitle: string
  highlightedSnippet: string
  contentType?: "web" | "news" | "video" | "image"
  imageUrl?: string | null
  videoUrl?: string | null
  thumbnailUrl?: string | null
  publishedDate?: Date | null
  author?: string | null
}

export interface SearchOptions {
  page: number
  perPage: number
  language?: string
  domain?: string
  sortBy?: "relevance" | "date"
  contentType?: "web" | "news" | "video" | "image"
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  page: number
  perPage: number
  totalPages: number
  query: string
  processingTime: number
  suggestions?: string[]
}

export interface RankingFactors {
  textRelevance: number
  titleMatch: number
  descriptionMatch: number
  keywordMatch: number
  pageRank: number
  freshness: number
  domainAuthority: number
  wordCount: number
}
