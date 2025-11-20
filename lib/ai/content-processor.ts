import { generateText } from "ai"

export interface ContentAnalysis {
  summary: string
  sentiment: "positive" | "neutral" | "negative"
  topics: string[]
  entities: string[]
  qualityScore: number
  spamScore: number
  category: string
  tags: string[]
}

export async function analyzeContent(title: string, content: string, url: string): Promise<ContentAnalysis> {
  try {
    const prompt = `Analyze this web content and provide structured insights:

Title: ${title}
URL: ${url}
Content: ${content.slice(0, 3000)}

Provide a JSON response with:
1. summary (2-3 sentences)
2. sentiment (positive/neutral/negative)
3. topics (array of main topics/themes)
4. entities (array of people, organizations, locations mentioned)
5. qualityScore (0-1, content quality/trustworthiness)
6. spamScore (0-1, likelihood of spam/low-quality)
7. category (news/technology/business/entertainment/sports/science/health/other)
8. tags (array of relevant keywords)

Return only valid JSON.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.3,
    })

    const analysis = JSON.parse(text)
    return analysis
  } catch (error) {
    console.error("Content analysis failed:", error)
    return {
      summary: title || "No summary available",
      sentiment: "neutral",
      topics: [],
      entities: [],
      qualityScore: 0.5,
      spamScore: 0.5,
      category: "other",
      tags: [],
    }
  }
}

export async function detectContentType(html: string, url: string): Promise<"web" | "news" | "video" | "image"> {
  const urlLower = url.toLowerCase()

  // Video detection
  if (
    urlLower.includes("youtube.com") ||
    urlLower.includes("vimeo.com") ||
    urlLower.includes("dailymotion.com") ||
    html.includes("<video") ||
    html.includes("player.vimeo") ||
    html.includes("youtube.com/embed")
  ) {
    return "video"
  }

  // Image detection
  if (
    urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
    urlLower.includes("imgur.com") ||
    urlLower.includes("flickr.com") ||
    html.includes('og:type" content="image')
  ) {
    return "image"
  }

  // News detection
  if (
    urlLower.includes("/news/") ||
    urlLower.includes("/article/") ||
    urlLower.includes("/blog/") ||
    html.includes("article:published_time") ||
    html.includes("datePublished") ||
    html.includes("<article")
  ) {
    return "news"
  }

  return "web"
}

export function extractMediaMetadata(html: string, contentType: string) {
  const metadata: {
    imageUrl?: string
    videoUrl?: string
    videoDuration?: number
    imageWidth?: number
    imageHeight?: number
    thumbnailUrl?: string
    publishedDate?: Date
    author?: string
  } = {}

  // Extract Open Graph and meta tags
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)
  const ogVideoMatch = html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]*)"/)
  const publishedMatch = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"/)
  const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"/)

  if (ogImageMatch) metadata.imageUrl = ogImageMatch[1]
  if (ogVideoMatch) metadata.videoUrl = ogVideoMatch[1]
  if (publishedMatch) metadata.publishedDate = new Date(publishedMatch[1])
  if (authorMatch) metadata.author = authorMatch[1]

  // Video-specific
  if (contentType === "video") {
    const durationMatch = html.match(/<meta[^>]*property="video:duration"[^>]*content="([^"]*)"/)
    if (durationMatch) metadata.videoDuration = Number.parseInt(durationMatch[1])
    metadata.thumbnailUrl = metadata.imageUrl
  }

  // Image-specific
  if (contentType === "image") {
    const widthMatch = html.match(/<meta[^>]*property="og:image:width"[^>]*content="([^"]*)"/)
    const heightMatch = html.match(/<meta[^>]*property="og:image:height"[^>]*content="([^"]*)"/)
    if (widthMatch) metadata.imageWidth = Number.parseInt(widthMatch[1])
    if (heightMatch) metadata.imageHeight = Number.parseInt(heightMatch[1])
  }

  return metadata
}
