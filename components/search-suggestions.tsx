"use client"

import { Card } from "@/components/ui/card"

interface SearchSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SearchSuggestions({ suggestions, onSelect }: SearchSuggestionsProps) {
  return (
    <Card className="absolute top-full mt-2 w-full z-50 p-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="w-full text-left px-4 py-2 hover:bg-accent rounded-md transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </Card>
  )
}
