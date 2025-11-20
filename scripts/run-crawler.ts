import { startCrawler } from "../lib/crawler/crawler"

const seedUrls = [
  "https://en.wikipedia.org/wiki/Main_Page",
  "https://github.com",
  "https://stackoverflow.com",
  "https://news.ycombinator.com",
]

console.log("Starting Natro web crawler...")
console.log("Seed URLs:", seedUrls)

startCrawler(seedUrls).catch((error) => {
  console.error("Crawler error:", error)
  process.exit(1)
})
