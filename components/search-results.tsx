"use client"

import { Clock, Calendar, User, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { SearchResponse } from "@/lib/search/types"

interface SearchResultsProps {
  results: SearchResponse
  onPageChange: (page: number) => void
  searchType?: "all" | "news" | "videos" | "images"
}

export function SearchResults({ results, onPageChange, searchType = "all" }: SearchResultsProps) {
  const { results: items, totalResults, page, totalPages, processingTime } = results

  const handleResultClick = async (resultUrl: string, resultId: string, position: number) => {
    const journeyTracker = (window as any).__natroJourneyTracker
    if (journeyTracker) {
      journeyTracker.trackClick(resultUrl, position)
    }

    try {
      await fetch("/api/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_id: results.query,
          page_id: resultId,
          clicked_url: resultUrl,
          position,
        }),
      })
    } catch (error) {
      console.error("Failed to track click:", error)
    }
  }

  if (searchType === "images") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>About {totalResults.toLocaleString()} results</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((result, index) => (
            <a
              key={result.id}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleResultClick(result.url, result.id, index + 1)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <img
                src={result.imageUrl || result.thumbnailUrl || "/placeholder.svg?height=300&width=300"}
                alt={result.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium line-clamp-2">{result.title}</p>
                  <p className="text-white/80 text-xs mt-1">{result.domain}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  onClick={() => onPageChange(p)}
                  className="w-10"
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (searchType === "videos") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>About {totalResults.toLocaleString()} results</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((result, index) => (
            <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleResultClick(result.url, result.id, index + 1)}
                className="block group"
              >
                <div className="relative aspect-video bg-muted">
                  <img
                    src={result.thumbnailUrl || result.imageUrl || "/placeholder.svg?height=180&width=320"}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <Play className="h-12 w-12 text-white" fill="white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-base line-clamp-2 group-hover:text-primary mb-2">{result.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{result.domain}</span>
                  </div>
                </div>
              </a>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  onClick={() => onPageChange(p)}
                  className="w-10"
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (searchType === "news") {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>About {totalResults.toLocaleString()} results</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{(processingTime / 1000).toFixed(2)}s</span>
          </div>
        </div>

        <div className="space-y-6">
          {items.map((result, index) => (
            <Card key={result.id} className="p-5 hover:shadow-md transition-shadow">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleResultClick(result.url, result.id, index + 1)}
                className="block group"
              >
                <div className="flex gap-4">
                  {result.thumbnailUrl && (
                    <img
                      src={result.thumbnailUrl || "/placeholder.svg"}
                      alt={result.title}
                      className="w-32 h-32 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground mb-2 flex items-center gap-3">
                      <span className="font-medium">{result.domain}</span>
                      {result.publishedDate && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(result.publishedDate).toLocaleDateString()}</span>
                          </div>
                        </>
                      )}
                      {result.author && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{result.author}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <h3
                      className="text-xl font-semibold text-primary group-hover:underline mb-2 leading-snug"
                      dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
                    />
                    <p
                      className="text-sm text-foreground leading-relaxed line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: result.highlightedSnippet }}
                    />
                  </div>
                </div>
              </a>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  onClick={() => onPageChange(p)}
                  className="w-10"
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Default "All" results layout
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <span>About {totalResults.toLocaleString()} results</span>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{(processingTime / 1000).toFixed(2)}s</span>
        </div>
      </div>

      <div className="space-y-6">
        {items.map((result, index) => (
          <Card key={result.id} className="p-4 hover:shadow-md transition-shadow">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleResultClick(result.url, result.id, index + 1)}
              className="block group"
            >
              <div className="flex items-start gap-3">
                {result.favicon && (
                  <img
                    src={result.favicon || "/placeholder.svg"}
                    alt=""
                    className="w-6 h-6 mt-1 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground mb-1 truncate">{result.domain}</div>
                  <h3
                    className="text-xl text-primary group-hover:underline mb-2 leading-snug"
                    dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
                  />
                  <p
                    className="text-sm text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: result.highlightedSnippet }}
                  />
                </div>
              </div>
            </a>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
            Previous
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                onClick={() => onPageChange(p)}
                className="w-10"
              >
                {p}
              </Button>
            ))}
          </div>

          <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
