import { getOrCreateWallet, earnTokens, checkDailyLimit } from "@/lib/database/repositories/tokens"

interface SearchQualityMetrics {
  queryLength: number
  queryComplexity: number
  resultsCount: number
  isUnique: boolean
  hasMultipleWords: boolean
}

interface ClickQualityMetrics {
  position: number
  clickSpeed: number
  hasScrolled: boolean
  timeOnPage: number
}

function calculateSearchQuality(metadata: Record<string, unknown>): number {
  const query = (metadata.query as string) || ""
  const resultsCount = (metadata.results_count as number) || 0

  const queryLength = query.length
  const wordCount = query.trim().split(/\s+/).length
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(query)

  let qualityScore = 0

  // Query length quality (0-30 points)
  if (queryLength >= 10 && queryLength <= 100) {
    qualityScore += 30
  } else if (queryLength >= 5 && queryLength < 10) {
    qualityScore += 15
  } else if (queryLength > 100) {
    qualityScore += 10
  }

  // Word count quality (0-25 points)
  if (wordCount >= 3 && wordCount <= 10) {
    qualityScore += 25
  } else if (wordCount === 2) {
    qualityScore += 15
  } else if (wordCount === 1) {
    qualityScore += 5
  }

  // Results quality (0-20 points)
  if (resultsCount > 0 && resultsCount < 1000) {
    qualityScore += 20
  } else if (resultsCount >= 1000) {
    qualityScore += 10
  }

  // Special characters (advanced query) (0-15 points)
  if (hasSpecialChars) {
    qualityScore += 15
  }

  // Diversity bonus (0-10 points) - checks if query has variety of characters
  const uniqueChars = new Set(query.toLowerCase()).size
  if (uniqueChars > query.length * 0.5) {
    qualityScore += 10
  }

  // Normalize to 0-1 range
  return Math.min(qualityScore / 100, 1)
}

function calculateClickQuality(metadata: Record<string, unknown>): number {
  const position = (metadata.position as number) || 999
  const timeOnPage = (metadata.time_on_page as number) || 0
  const hasScrolled = (metadata.has_scrolled as boolean) || false

  let qualityScore = 0

  // Click position quality (0-35 points)
  // Clicks on lower ranked results are more valuable for learning
  if (position >= 5 && position <= 20) {
    qualityScore += 35 // Most valuable - indicates user found result beyond obvious choices
  } else if (position >= 2 && position <= 4) {
    qualityScore += 25
  } else if (position === 1) {
    qualityScore += 10 // Least valuable - everyone clicks first result
  } else if (position > 20) {
    qualityScore += 30 // Deep exploration
  }

  // Time on page quality (0-30 points)
  if (timeOnPage > 30) {
    qualityScore += 30 // Spent significant time
  } else if (timeOnPage > 15) {
    qualityScore += 20
  } else if (timeOnPage > 5) {
    qualityScore += 10
  }

  // Scroll engagement (0-20 points)
  if (hasScrolled) {
    qualityScore += 20
  }

  // Quick bounce penalty (0-15 points)
  if (timeOnPage < 2) {
    qualityScore += 0 // Likely not useful data
  } else {
    qualityScore += 15
  }

  // Normalize to 0-1 range
  return Math.min(qualityScore / 100, 1)
}

function calculateTokenReward(qualityScore: number, baseAmount = 1.0): number {
  // Quality score is 0-1, reward is baseAmount * qualityScore
  // Minimum reward is 0.01 tokens, maximum is baseAmount
  const reward = baseAmount * qualityScore
  return Math.max(0.01, Math.min(reward, baseAmount))
}

export async function rewardTokens(sessionId: string, actionType: string, metadata?: Record<string, unknown>) {
  try {
    const wallet = await getOrCreateWallet(sessionId)

    const withinLimit = await checkDailyLimit(wallet.id, actionType)
    if (!withinLimit) {
      return null
    }

    let qualityScore = 0
    let baseAmount = 0

    if (actionType === "search") {
      qualityScore = calculateSearchQuality(metadata || {})
      baseAmount = 0.5 // Base: 0.50 tokens per search
    } else if (actionType === "click") {
      qualityScore = calculateClickQuality(metadata || {})
      baseAmount = 0.3 // Base: 0.30 tokens per click
    } else {
      return null
    }

    const tokenAmount = calculateTokenReward(qualityScore, baseAmount)

    const transaction = await earnTokens({
      walletId: wallet.id,
      amount: tokenAmount,
      actionType,
      metadata: {
        ...metadata,
        quality_score: qualityScore,
        base_amount: baseAmount,
      },
    })

    return transaction
  } catch (error) {
    console.error(`Token reward error for ${actionType}:`, error)
    return null
  }
}
