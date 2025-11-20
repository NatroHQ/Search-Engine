import type { CrawlerConfig } from "./types"

const DEFAULT_CONFIG: CrawlerConfig = {
  maxDepth: 3,
  maxPagesPerDomain: 1000,
  crawlDelay: 1000,
  userAgent: "NatroBot/1.0 (+https://search.natro.io/bot)",
  timeout: 10000,
  blockedDomains: ["facebook.com", "instagram.com", "twitter.com", "youtube.com"],
}

export async function fetchPage(
  url: string,
  config: Partial<CrawlerConfig> = {},
): Promise<{ html: string; statusCode: number; contentType: string }> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), cfg.timeout)

    const response = await fetch(url, {
      headers: {
        "User-Agent": cfg.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeoutId)

    const contentType = response.headers.get("content-type") || ""

    if (!contentType.includes("text/html")) {
      throw new Error(`Invalid content type: ${contentType}`)
    }

    const html = await response.text()

    return {
      html,
      statusCode: response.status,
      contentType,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`)
    }
    throw error
  }
}

export function isUrlAllowed(url: string, config: Partial<CrawlerConfig> = {}): boolean {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    if (cfg.blockedDomains?.some((blocked) => domain.includes(blocked))) {
      return false
    }

    if (cfg.allowedDomains && cfg.allowedDomains.length > 0) {
      return cfg.allowedDomains.some((allowed) => domain.includes(allowed))
    }

    return true
  } catch {
    return false
  }
}

export function normalizeUrl(url: string, baseUrl?: string): string | null {
  try {
    const urlObj = new URL(url, baseUrl)

    urlObj.hash = ""

    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search)
      const allowedParams = ["id", "page", "category", "tag"]
      const filteredParams = new URLSearchParams()

      allowedParams.forEach((param) => {
        if (params.has(param)) {
          filteredParams.set(param, params.get(param)!)
        }
      })

      urlObj.search = filteredParams.toString()
    }

    return urlObj.toString()
  } catch {
    return null
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
