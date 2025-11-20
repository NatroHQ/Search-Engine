import { startEnhancedCrawler } from "../lib/crawler/enhanced-crawler"

const seedUrls = [
  "https://news.ycombinator.com",
  "https://www.bbc.com/news",
  "https://www.reuters.com",
  "https://techcrunch.com",
  "https://www.theguardian.com",
  "https://www.youtube.com",
  "https://vimeo.com",
  "https://unsplash.com",
  "https://www.pexels.com",
]

console.log("Starting Natro Enhanced Crawler with AI processing...")
console.log("Seed URLs:", seedUrls)
console.log("Content types: Web, News, Videos, Images")
console.log("Press Ctrl+C to stop\n")

startEnhancedCrawler(seedUrls, true).catch((error) => {
  console.error("Crawler failed:", error)
  process.exit(1)
})
