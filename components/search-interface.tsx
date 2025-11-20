"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchResults } from "./search-results"
import { SearchSuggestions } from "./search-suggestions"
import { TokenBalance } from "./token-balance"
import type { SearchResponse } from "@/lib/search/types"

type SearchType = "all" | "news" | "videos" | "images"

interface SearchInterfaceProps {
  sessionId: string
}

export function SearchInterface({ sessionId }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchType, setSearchType] = useState<SearchType>("all")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        if (data.success) {
          setSuggestions(data.data.suggestions)
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = async (searchQuery: string, page = 1, type: SearchType = searchType) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)
    setHasSearched(true)

    const journeyTracker = (window as any).__natroJourneyTracker
    if (journeyTracker) {
      journeyTracker.trackSearch(searchQuery, 0) // Will be updated with actual count
    }

    try {
      const typeParam =
        type !== "all" ? `&type=${type === "videos" ? "video" : type === "images" ? "image" : type}` : ""
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}${typeParam}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data)

        // Update journey tracker with actual results count
        if (journeyTracker) {
          journeyTracker.trackSearch(searchQuery, data.data.results.length)
        }
      } else {
        console.error("Search failed:", data.error)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    handleSearch(suggestion)
  }

  const handlePageChange = (page: number) => {
    handleSearch(query, page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type)
    if (hasSearched && query) {
      handleSearch(query, 1, type)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className={`w-full transition-all duration-300 ${hasSearched ? "py-4 border-b" : "py-12"}`}>
        <div className="container mx-auto px-4">
          <div className={`flex items-center gap-8 ${hasSearched ? "flex-row" : "flex-col"}`}>
            <h1 className={`font-bold text-primary transition-all ${hasSearched ? "text-2xl" : "text-6xl"}`}>Natro</h1>

            <div className={`relative w-full transition-all ${hasSearched ? "max-w-2xl" : "max-w-3xl"}`}>
              <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search the web..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-12 pr-24 h-14 text-lg rounded-full border-2 focus-visible:ring-2"
                />
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 px-6"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <SearchSuggestions suggestions={suggestions} onSelect={handleSuggestionClick} />
              )}
            </div>

            {hasSearched && (
              <div className="ml-auto">
                <TokenBalance sessionId={sessionId} />
              </div>
            )}
          </div>

          {!hasSearched && (
            <div className="mt-8 flex justify-center">
              <TokenBalance sessionId={sessionId} />
            </div>
          )}
        </div>

        {hasSearched && (
          <div className="container mx-auto px-4 mt-4">
            <div className="flex gap-6 border-b">
              <button
                onClick={() => handleTypeChange("all")}
                className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                  searchType === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
                {searchType === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => handleTypeChange("news")}
                className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                  searchType === "news" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                News
                {searchType === "news" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => handleTypeChange("videos")}
                className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                  searchType === "videos" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Videos
                {searchType === "videos" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => handleTypeChange("images")}
                className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                  searchType === "images" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Images
                {searchType === "images" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1">
        {results && <SearchResults results={results} onPageChange={handlePageChange} searchType={searchType} />}

        {!hasSearched && (
          <div className="container mx-auto px-4 py-16 text-center space-y-8">
            <p className="text-muted-foreground text-lg">Fast, independent search with custom ranking algorithms</p>
          </div>
        )}
      </div>

      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Natro Search Engine - Independent Web Search</p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/NatroHQ/Search-Engine"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://x.com/NatroHQ"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                X (Twitter)
              </a>
              <a href="mailto:hi@natro.io" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
