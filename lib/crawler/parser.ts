import { JSDOM } from "jsdom"
import type { ParsedLink } from "./types"

export function parseHTML(html: string, baseUrl: string) {
  const dom = new JSDOM(html)
  const document = dom.window.document

  const title = extractTitle(document)
  const description = extractDescription(document)
  const content = extractContent(document)
  const links = extractLinks(document, baseUrl)
  const language = extractLanguage(document)
  const favicon = extractFavicon(document, baseUrl)

  return {
    title,
    description,
    content,
    links,
    language,
    favicon,
  }
}

function extractTitle(document: Document): string {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content")
  if (ogTitle) return ogTitle

  const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute("content")
  if (twitterTitle) return twitterTitle

  const titleTag = document.querySelector("title")?.textContent
  if (titleTag) return titleTag.trim()

  const h1 = document.querySelector("h1")?.textContent
  if (h1) return h1.trim()

  return "Untitled Page"
}

function extractDescription(document: Document): string {
  const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute("content")
  if (ogDescription) return ogDescription

  const twitterDescription = document.querySelector('meta[name="twitter:description"]')?.getAttribute("content")
  if (twitterDescription) return twitterDescription

  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content")
  if (metaDescription) return metaDescription

  const firstParagraph = document.querySelector("p")?.textContent
  if (firstParagraph) {
    return firstParagraph.trim().substring(0, 200)
  }

  return ""
}

function extractContent(document: Document): string {
  const elementsToRemove = ["script", "style", "nav", "header", "footer", "aside", "iframe", "noscript"]

  elementsToRemove.forEach((tag) => {
    document.querySelectorAll(tag).forEach((el) => el.remove())
  })

  const mainContent =
    document.querySelector("main")?.textContent ||
    document.querySelector("article")?.textContent ||
    document.querySelector('[role="main"]')?.textContent ||
    document.body?.textContent ||
    ""

  return mainContent.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim()
}

function extractLinks(document: Document, baseUrl: string): ParsedLink[] {
  const links: ParsedLink[] = []
  const seenUrls = new Set<string>()

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href")
    if (!href) return

    try {
      const absoluteUrl = new URL(href, baseUrl).toString()
      const baseUrlObj = new URL(baseUrl)
      const linkUrlObj = new URL(absoluteUrl)

      if (seenUrls.has(absoluteUrl)) return
      seenUrls.add(absoluteUrl)

      if (linkUrlObj.protocol !== "http:" && linkUrlObj.protocol !== "https:") {
        return
      }

      const type = linkUrlObj.hostname === baseUrlObj.hostname ? "internal" : "external"

      links.push({
        url: absoluteUrl,
        text: anchor.textContent?.trim() || "",
        type,
      })
    } catch {
      // Invalid URL, skip
    }
  })

  return links
}

function extractLanguage(document: Document): string {
  return (
    document.documentElement.getAttribute("lang")?.split("-")[0] ||
    document.querySelector('meta[http-equiv="content-language"]')?.getAttribute("content")?.split("-")[0] ||
    "en"
  )
}

function extractFavicon(document: Document, baseUrl: string): string {
  const iconLink =
    document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]') ||
    document.querySelector('link[rel="apple-touch-icon"]')

  if (iconLink) {
    const href = iconLink.getAttribute("href")
    if (href) {
      try {
        return new URL(href, baseUrl).toString()
      } catch {
        // Invalid URL
      }
    }
  }

  try {
    const urlObj = new URL(baseUrl)
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  } catch {
    return ""
  }
}
