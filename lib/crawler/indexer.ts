import type { ExtractedKeyword } from "./types"

const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "might",
  "more",
  "most",
  "must",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
])

export function extractKeywords(content: string, title: string, description: string): ExtractedKeyword[] {
  const allText = `${title} ${title} ${title} ${description} ${description} ${content}`

  const words = allText
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))

  const wordFrequency = new Map<string, number>()
  words.forEach((word) => {
    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1)
  })

  const titleWords = new Set(
    title
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/),
  )

  const descriptionWords = new Set(
    description
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/),
  )

  const keywords: ExtractedKeyword[] = []

  wordFrequency.forEach((frequency, keyword) => {
    let relevance = frequency / words.length

    if (titleWords.has(keyword)) {
      relevance *= 3.0
    }

    if (descriptionWords.has(keyword)) {
      relevance *= 2.0
    }

    if (frequency > 5) {
      relevance *= 1.5
    }

    keywords.push({
      keyword,
      frequency,
      relevance,
    })
  })

  return keywords.sort((a, b) => b.relevance - a.relevance).slice(0, 50)
}

export function calculateWordCount(content: string): number {
  return content.split(/\s+/).filter((word) => word.length > 0).length
}

export function generateTextSnippet(content: string, maxLength = 300): string {
  const cleaned = content.replace(/\s+/g, " ").trim()

  if (cleaned.length <= maxLength) {
    return cleaned
  }

  const truncated = cleaned.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}
