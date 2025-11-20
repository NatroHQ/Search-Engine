import type { CrawlResult, CrawlerConfig } from "./types"
import { fetchPage, normalizeUrl, isUrlAllowed, sleep } from "./fetcher"
import { parseHTML } from "./parser"
import { extractKeywords, calculateWordCount } from "./indexer"
import { insertPage, insertPageKeywords, insertPageLinks } from "../database/repositories/pages"
import { addUrlToQueue, getNextUrlsToProcess, markUrlCompleted, markUrlFailed } from "../database/repositories/crawler"
import { analyzeContent, detectContentType, extractMediaMetadata } from "../ai/content-processor"
import { executeQuery } from "../database/client"

export class EnhancedCrawler {
  private config: CrawlerConfig
  private domainCounts: Map<string, number> = new Map()
  private lastCrawlTime: Map<string, number> = new Map()
  private aiEnabled: boolean

  constructor(config: Partial<CrawlerConfig> = {}, aiEnabled = true) {
    this.config = {
      maxDepth: 3,
      maxPagesPerDomain: 1000,
      crawlDelay: 1000,
      userAgent: "NatroBot/1.0 (+https://search.natro.io/bot)",
      timeout: 10000,
      ...config,
    }
    this.aiEnabled = aiEnabled
  }

  async crawlUrl(url: string, depth = 0): Promise<CrawlResult & { contentType?: string }> {
    const normalizedUrl = normalizeUrl(url)

    if (!normalizedUrl || !isUrlAllowed(normalizedUrl, this.config)) {
      return {
        url: url || normalizedUrl || "",
        title: "",
        description: "",
        content: "",
        links: [],
        language: "en",
        favicon: "",
        domain: "",
        path: "",
        wordCount: 0,
        keywords: [],
        success: false,
        error: !normalizedUrl ? "Invalid URL" : "URL not allowed",
      }
    }

    try {
      const urlObj = new URL(normalizedUrl)
      const domain = urlObj.hostname

      const domainCount = this.domainCounts.get(domain) || 0
      if (domainCount >= this.config.maxPagesPerDomain) {
        return {
          url: normalizedUrl,
          title: "",
          description: "",
          content: "",
          links: [],
          language: "en",
          favicon: "",
          domain,
          path: urlObj.pathname,
          wordCount: 0,
          keywords: [],
          success: false,
          error: "Domain page limit reached",
        }
      }

      const lastCrawl = this.lastCrawlTime.get(domain) || 0
      const timeSinceLastCrawl = Date.now() - lastCrawl
      if (timeSinceLastCrawl < this.config.crawlDelay) {
        await sleep(this.config.crawlDelay - timeSinceLastCrawl)
      }

      const { html } = await fetchPage(normalizedUrl, this.config)
      this.lastCrawlTime.set(domain, Date.now())

      const contentType = await detectContentType(html, normalizedUrl)
      const mediaMetadata = extractMediaMetadata(html, contentType)
      const parsed = parseHTML(html, normalizedUrl)
      const keywords = extractKeywords(parsed.content, parsed.title, parsed.description)
      const wordCount = calculateWordCount(parsed.content)

      this.domainCounts.set(domain, domainCount + 1)

      return {
        url: normalizedUrl,
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        links: parsed.links,
        language: parsed.language,
        favicon: parsed.favicon,
        domain,
        path: urlObj.pathname,
        wordCount,
        keywords,
        success: true,
        contentType,
        ...mediaMetadata,
      }
    } catch (error) {
      return {
        url: normalizedUrl,
        title: "",
        description: "",
        content: "",
        links: [],
        language: "en",
        favicon: "",
        domain: "",
        path: "",
        wordCount: 0,
        keywords: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async processQueue(batchSize = 10): Promise<number> {
    const items = await getNextUrlsToProcess(batchSize)
    let processed = 0

    for (const item of items) {
      const result = await this.crawlUrl(item.url, item.depth)

      if (result.success) {
        try {
          let aiAnalysis = null
          if (this.aiEnabled && result.content && result.title) {
            aiAnalysis = await analyzeContent(result.title, result.content, result.url)
          }

          const page = await insertPage({
            url: result.url,
            title: result.title,
            description: result.description,
            content: result.content,
            language: result.language,
            favicon_url: result.favicon,
            domain: result.domain,
            path: result.path,
            word_count: result.wordCount,
            content_type: (result as any).contentType || "web",
            published_date: (result as any).publishedDate || null,
            author: (result as any).author || null,
            image_url: (result as any).imageUrl || null,
            video_url: (result as any).videoUrl || null,
            video_duration: (result as any).videoDuration || null,
            image_width: (result as any).imageWidth || null,
            image_height: (result as any).imageHeight || null,
            thumbnail_url: (result as any).thumbnailUrl || null,
            category: aiAnalysis?.category || null,
            ai_summary: aiAnalysis?.summary || null,
            ai_tags: aiAnalysis?.tags || null,
          })

          if (aiAnalysis) {
            await executeQuery(
              `INSERT INTO content_insights (page_id, summary, sentiment, topics, entities, quality_score, spam_score)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                page.id,
                aiAnalysis.summary,
                aiAnalysis.sentiment,
                aiAnalysis.topics,
                aiAnalysis.entities,
                aiAnalysis.qualityScore,
                aiAnalysis.spamScore,
              ],
            )
          }

          await insertPageKeywords(
            page.id,
            result.keywords.map((k) => ({
              keyword: k.keyword,
              frequency: k.frequency,
              relevance_score: k.relevance,
            })),
          )

          await insertPageLinks(
            page.id,
            result.links.map((link) => ({
              target_url: link.url,
              anchor_text: link.text,
              link_type: link.type,
            })),
          )

          if (item.depth < this.config.maxDepth) {
            const internalLinks = result.links.filter((l) => l.type === "internal")
            for (const link of internalLinks.slice(0, 20)) {
              await addUrlToQueue(link.url, 5, item.depth + 1)
            }
          }

          await markUrlCompleted(item.id)
          processed++

          console.log(`Processed: ${result.url} [${(result as any).contentType || "web"}]`)
        } catch (error) {
          console.error(`Failed to save page ${result.url}:`, error)
          await markUrlFailed(item.id, error instanceof Error ? error.message : "Save failed")
        }
      } else {
        await markUrlFailed(item.id, result.error || "Crawl failed")
      }
    }

    return processed
  }

  async startContinuous(checkInterval = 30000): Promise<void> {
    console.log("Starting continuous crawler with AI processing...")

    while (true) {
      try {
        const processed = await this.processQueue(5)

        if (processed === 0) {
          console.log("No URLs in queue. Waiting for new URLs...")
          await sleep(checkInterval)
        } else {
          console.log(`Batch complete: ${processed} pages processed`)
          await sleep(5000)
        }
      } catch (error) {
        console.error("Crawler error:", error)
        await sleep(10000)
      }
    }
  }
}

export async function startEnhancedCrawler(seedUrls: string[] = [], aiEnabled = true): Promise<void> {
  for (const url of seedUrls) {
    await addUrlToQueue(url, 10, 0)
  }

  const crawler = new EnhancedCrawler({}, aiEnabled)
  await crawler.startContinuous()
}
