// LLM-powered behavior analysis

import { generateObject } from "ai"

interface BehaviorAnalysisInput {
  sessionId: string
  events: Array<{
    type: string
    timestamp: number
    data: Record<string, unknown>
  }>
  metrics: {
    totalTime: number
    activeTime: number
    searchesPerformed: number
    clicksMade: number
    pagesVisited: number
  }
  journeySteps: Array<{
    action: string
    details: Record<string, unknown>
  }>
}

interface BehaviorAnalysisResult {
  qualityScore: number
  engagementLevel: "low" | "medium" | "high" | "very_high"
  intentPrediction: string
  userSegment: string
  anomalyDetected: boolean
  insights: {
    searchQuality: number
    navigationPattern: string
    timeUtilization: string
    engagementIndicators: string[]
    recommendedTokens: number
  }
  confidence: number
}

export async function analyzeBehaviorWithLLM(input: BehaviorAnalysisInput): Promise<BehaviorAnalysisResult> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o",
      schema: {
        type: "object",
        properties: {
          qualityScore: { type: "number", minimum: 0, maximum: 100 },
          engagementLevel: {
            type: "string",
            enum: ["low", "medium", "high", "very_high"],
          },
          intentPrediction: { type: "string" },
          userSegment: { type: "string" },
          anomalyDetected: { type: "boolean" },
          insights: {
            type: "object",
            properties: {
              searchQuality: { type: "number" },
              navigationPattern: { type: "string" },
              timeUtilization: { type: "string" },
              engagementIndicators: {
                type: "array",
                items: { type: "string" },
              },
              recommendedTokens: { type: "number" },
            },
            required: [
              "searchQuality",
              "navigationPattern",
              "timeUtilization",
              "engagementIndicators",
              "recommendedTokens",
            ],
          },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: [
          "qualityScore",
          "engagementLevel",
          "intentPrediction",
          "userSegment",
          "anomalyDetected",
          "insights",
          "confidence",
        ],
      },
      prompt: `Analyze the following user behavior data and determine the quality and engagement level of this session.

Session Metrics:
- Total Time: ${input.metrics.totalTime}s
- Active Time: ${input.metrics.activeTime}s
- Searches: ${input.metrics.searchesPerformed}
- Clicks: ${input.metrics.clicksMade}
- Pages Visited: ${input.metrics.pagesVisited}

Journey Steps: ${JSON.stringify(input.journeySteps, null, 2)}

Recent Events: ${JSON.stringify(input.events.slice(-20), null, 2)}

Provide:
1. Quality Score (0-100): How valuable is this user's engagement?
2. Engagement Level: low/medium/high/very_high
3. Intent Prediction: What is the user trying to accomplish?
4. User Segment: research/shopping/casual/professional/student
5. Anomaly Detection: Is this behavior suspicious or bot-like?
6. Insights including:
   - Search Quality (0-100)
   - Navigation Pattern description
   - Time Utilization assessment
   - Engagement Indicators list
   - Recommended Tokens to award (based on quality)
7. Confidence Score (0-1): How confident are you in this analysis?

Award more tokens for:
- Longer active engagement time
- Diverse search queries
- Multiple page visits with reasonable time on each
- Natural mouse movement patterns
- Scrolling behavior
- Clicking on relevant results

Award fewer tokens for:
- Very short sessions
- Repetitive actions
- Bot-like patterns
- No meaningful engagement`,
    })

    return object as BehaviorAnalysisResult
  } catch (error) {
    console.error("[v0] LLM behavior analysis failed:", error)

    // Fallback to rule-based analysis
    return fallbackAnalysis(input)
  }
}

function fallbackAnalysis(input: BehaviorAnalysisInput): BehaviorAnalysisResult {
  const { metrics } = input

  // Simple rule-based scoring
  let qualityScore = 0

  // Time-based scoring (max 30 points)
  const timeScore = Math.min((metrics.activeTime / 300) * 30, 30)
  qualityScore += timeScore

  // Search quality (max 25 points)
  const searchScore = Math.min(metrics.searchesPerformed * 5, 25)
  qualityScore += searchScore

  // Click engagement (max 25 points)
  const clickScore = Math.min(metrics.clicksMade * 3, 25)
  qualityScore += clickScore

  // Page diversity (max 20 points)
  const pageScore = Math.min(metrics.pagesVisited * 4, 20)
  qualityScore += pageScore

  let engagementLevel: "low" | "medium" | "high" | "very_high" = "low"
  if (qualityScore >= 80) engagementLevel = "very_high"
  else if (qualityScore >= 60) engagementLevel = "high"
  else if (qualityScore >= 40) engagementLevel = "medium"

  const recommendedTokens = Math.round((qualityScore / 100) * 2.0 * 100) / 100

  return {
    qualityScore,
    engagementLevel,
    intentPrediction: "Information seeking",
    userSegment: "general",
    anomalyDetected: false,
    insights: {
      searchQuality: searchScore,
      navigationPattern: "Standard browsing",
      timeUtilization: "Normal engagement",
      engagementIndicators: ["Active participation", "Search activity"],
      recommendedTokens,
    },
    confidence: 0.7,
  }
}
