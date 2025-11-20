import type { CrawlResult, CrawlerConfig } from "./types"
import { fetchPage, normalizeUrl, isUrlAllowed, sleep } from "./fetcher"
import { parseHTML } from "./parser"
import { extractKeywords, calculateWordCount } from "./indexer"
import { insertPage, insertPageKeywords, insertPageLinks } from "../database/repositories/pages"
import { addUrlToQueue, getNextUrlsToProcess, markUrlCompleted, markUrlFailed } from "../database/repositories/crawler"

export class WebCrawler {
  private config: CrawlerConfig
  private domainCounts: Map<string, number> = new Map()
  private lastCrawlTime: Map<string, number> = new Map()

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = {
      maxDepth: 3,
      maxPagesPerDomain: 1000,
      crawlDelay: 1000,
      userAgent: "NatroBot/1.0 (+https://search.natro.io/bot)",
      timeout: 10000,
      ...config,
    }
  }

  async crawlUrl(url: string, depth = 0): Promise<CrawlResult> {
    const normalizedUrl = normalizeUrl(url)

    if (!normalizedUrl) {
      return {
        url,
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
        error: "Invalid URL",
      }
    }

    if (!isUrlAllowed(normalizedUrl, this.config)) {
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
        error: "URL not allowed",
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
          })

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
}

export async function startCrawler(seedUrls: string[] = []): Promise<void> {
  for (const url of seedUrls) {
    await addUrlToQueue(url, 10, 0)
  }

  const crawler = new WebCrawler()

  while (true) {
    const processed = await crawler.processQueue(10)

    if (processed === 0) {
      console.log("No more URLs to process. Waiting...")
      await sleep(60000)
    } else {
      console.log(`Processed ${processed} URLs`)
      await sleep(5000)
    }
  }
}
