import { query } from "../database/client"
import type { PopularSearch } from "../database/schema"

export async function generateSuggestions(searchQuery: string, limit = 5): Promise<string[]> {
  if (!searchQuery || searchQuery.length < 2) {
    return []
  }

  const queryLower = searchQuery.toLowerCase().trim()

  const popularSearches = await query<PopularSearch>(
    `SELECT query, search_count 
     FROM popular_searches 
     WHERE LOWER(query) LIKE $1
     ORDER BY search_count DESC 
     LIMIT $2`,
    [`%${queryLower}%`, limit],
  )

  const suggestions = popularSearches.map((s) => s.query)

  if (suggestions.length < limit) {
    const keywordSuggestions = await query<{ keyword: string }>(
      `SELECT DISTINCT keyword 
       FROM page_keywords 
       WHERE keyword LIKE $1
       ORDER BY keyword
       LIMIT $2`,
      [`${queryLower}%`, limit - suggestions.length],
    )

    keywordSuggestions.forEach((k) => {
      if (!suggestions.includes(k.keyword)) {
        suggestions.push(k.keyword)
      }
    })
  }

  return suggestions
}

export function generateDidYouMean(query: string, suggestions: string[]): string | null {
  if (!query || suggestions.length === 0) return null

  const queryLower = query.toLowerCase()

  for (const suggestion of suggestions) {
    const distance = levenshteinDistance(queryLower, suggestion.toLowerCase())

    if (distance > 0 && distance <= 3) {
      return suggestion
    }
  }

  return null
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  return matrix[str2.length][str1.length]
}
