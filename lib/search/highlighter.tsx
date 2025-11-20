export function highlightText(text: string, query: string): string {
  if (!text || !query) return text

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)

  let result = text

  queryWords.forEach((word) => {
    const regex = new RegExp(`(${escapeRegex(word)})`, "gi")
    result = result.replace(regex, "<mark>$1</mark>")
  })

  return result
}

export function generateSnippet(content: string, query: string, maxLength = 200): string {
  if (!content || !query) {
    return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "")
  }

  const queryLower = query.toLowerCase()
  const contentLower = content.toLowerCase()

  const exactMatchIndex = contentLower.indexOf(queryLower)

  if (exactMatchIndex !== -1) {
    return extractSnippetAround(content, exactMatchIndex, maxLength)
  }

  const queryWords = query.split(/\s+/).filter((word) => word.length > 2)

  for (const word of queryWords) {
    const wordIndex = contentLower.indexOf(word.toLowerCase())
    if (wordIndex !== -1) {
      return extractSnippetAround(content, wordIndex, maxLength)
    }
  }

  return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "")
}

function extractSnippetAround(text: string, index: number, maxLength: number): string {
  const halfLength = Math.floor(maxLength / 2)

  let start = Math.max(0, index - halfLength)
  let end = Math.min(text.length, index + halfLength)

  if (start > 0) {
    const spaceIndex = text.indexOf(" ", start)
    if (spaceIndex !== -1 && spaceIndex < start + 20) {
      start = spaceIndex + 1
    }
  }

  if (end < text.length) {
    const spaceIndex = text.lastIndexOf(" ", end)
    if (spaceIndex !== -1 && spaceIndex > end - 20) {
      end = spaceIndex
    }
  }

  const snippet = text.substring(start, end).trim()
  const prefix = start > 0 ? "..." : ""
  const suffix = end < text.length ? "..." : ""

  return prefix + snippet + suffix
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
