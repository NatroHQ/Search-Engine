import type { IndexedPage } from "../database/schema"
import type { RankingFactors } from "./types"

export function calculateRelevanceScore(page: IndexedPage, query: string, keywords: string[]): number {
  const factors = calculateRankingFactors(page, query, keywords)

  const weights = {
    textRelevance: 0.25,
    titleMatch: 0.3,
    descriptionMatch: 0.15,
    keywordMatch: 0.1,
    pageRank: 0.1,
    freshness: 0.05,
    domainAuthority: 0.03,
    wordCount: 0.02,
  }

  const score =
    factors.textRelevance * weights.textRelevance +
    factors.titleMatch * weights.titleMatch +
    factors.descriptionMatch * weights.descriptionMatch +
    factors.keywordMatch * weights.keywordMatch +
    factors.pageRank * weights.pageRank +
    factors.freshness * weights.freshness +
    factors.domainAuthority * weights.domainAuthority +
    factors.wordCount * weights.wordCount

  return Math.min(Math.max(score, 0), 1)
}

function calculateRankingFactors(page: IndexedPage, query: string, keywords: string[]): RankingFactors {
  const queryLower = query.toLowerCase()
  const titleLower = (page.title || "").toLowerCase()
  const descriptionLower = (page.description || "").toLowerCase()
  const contentLower = (page.content || "").toLowerCase()

  const titleMatch = calculateTextMatch(titleLower, queryLower, keywords)
  const descriptionMatch = calculateTextMatch(descriptionLower, queryLower, keywords)
  const contentMatch = calculateTextMatch(contentLower, queryLower, keywords)

  const textRelevance = Math.max(titleMatch * 0.5 + descriptionMatch * 0.3 + contentMatch * 0.2, 0)

  const keywordMatch = calculateKeywordMatch(page, keywords)

  const freshness = calculateFreshness(page.last_indexed_at)

  const domainAuthority = calculateDomainAuthority(page.domain || "")

  const wordCount = normalizeWordCount(page.word_count)

  return {
    textRelevance,
    titleMatch,
    descriptionMatch,
    keywordMatch,
    pageRank: page.page_rank,
    freshness,
    domainAuthority,
    wordCount,
  }
}

function calculateTextMatch(text: string, query: string, keywords: string[]): number {
  if (!text) return 0

  let score = 0

  if (text.includes(query)) {
    score += 1.0
  }

  keywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      score += 0.5
    }
  })

  const words = text.split(/\s+/)
  const queryWords = query.split(/\s+/)
  const matchedWords = queryWords.filter((word) => words.some((w) => w.includes(word)))

  score += matchedWords.length / queryWords.length

  return Math.min(score, 1.0)
}

function calculateKeywordMatch(page: IndexedPage, keywords: string[]): number {
  if (keywords.length === 0) return 0

  const contentLower = (page.content || "").toLowerCase()
  let matches = 0

  keywords.forEach((keyword) => {
    if (contentLower.includes(keyword)) {
      matches++
    }
  })

  return matches / keywords.length
}

function calculateFreshness(lastIndexed: Date): number {
  const now = new Date()
  const daysSinceIndexed = (now.getTime() - lastIndexed.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceIndexed <= 1) return 1.0
  if (daysSinceIndexed <= 7) return 0.9
  if (daysSinceIndexed <= 30) return 0.7
  if (daysSinceIndexed <= 90) return 0.5
  if (daysSinceIndexed <= 180) return 0.3
  return 0.1
}

function calculateDomainAuthority(domain: string): number {
  const trustedDomains = new Set([
    "wikipedia.org",
    "github.com",
    "stackoverflow.com",
    "medium.com",
    "reddit.com",
    "youtube.com",
  ])

  if (trustedDomains.has(domain)) {
    return 1.0
  }

  const parts = domain.split(".")
  if (parts.length === 2 && parts[1].length <= 3) {
    return 0.7
  }

  return 0.5
}

function normalizeWordCount(wordCount: number): number {
  if (wordCount < 100) return 0.3
  if (wordCount < 500) return 0.6
  if (wordCount < 1000) return 0.8
  if (wordCount < 2000) return 1.0
  if (wordCount < 5000) return 0.9
  return 0.7
}

export function calculatePageRank(pages: IndexedPage[], links: Map<string, string[]>): Map<string, number> {
  const pageRanks = new Map<string, number>()
  const dampingFactor = 0.85
  const iterations = 20

  pages.forEach((page) => {
    pageRanks.set(page.id, 1.0 / pages.length)
  })

  for (let i = 0; i < iterations; i++) {
    const newRanks = new Map<string, number>()

    pages.forEach((page) => {
      let rank = (1 - dampingFactor) / pages.length

      const incomingLinks = links.get(page.id) || []
      incomingLinks.forEach((sourceId) => {
        const sourceRank = pageRanks.get(sourceId) || 0
        const outgoingCount = (links.get(sourceId) || []).length || 1
        rank += dampingFactor * (sourceRank / outgoingCount)
      })

      newRanks.set(page.id, rank)
    })

    pageRanks.clear()
    newRanks.forEach((rank, id) => pageRanks.set(id, rank))
  }

  return pageRanks
}
