export interface CrawlResult {
  url: string
  title: string
  description: string
  content: string
  links: ParsedLink[]
  language: string
  favicon: string
  domain: string
  path: string
  wordCount: number
  keywords: ExtractedKeyword[]
  success: boolean
  error?: string
}

export interface ParsedLink {
  url: string
  text: string
  type: "internal" | "external"
}

export interface ExtractedKeyword {
  keyword: string
  frequency: number
  relevance: number
}

export interface CrawlerConfig {
  maxDepth: number
  maxPagesPerDomain: number
  crawlDelay: number
  userAgent: string
  timeout: number
  allowedDomains?: string[]
  blockedDomains?: string[]
}
