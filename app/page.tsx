"use client"

import { useState, useEffect } from "react"
import { SearchInterface } from "@/components/search-interface"
import { ConsentBanner } from "@/components/consent-banner"
import { TrackingProvider } from "@/components/tracking-provider"
import { generateSessionId, hasConsent } from "@/lib/utils/session"

export default function HomePage() {
  const [sessionId, setSessionId] = useState<string>("")
  const [consentGiven, setConsentGiven] = useState<boolean>(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize session
    const id = generateSessionId()
    const consent = hasConsent()

    setSessionId(id)
    setConsentGiven(consent)
    setIsReady(true)

    // Sync session with server
    fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent_given: consent }),
    }).catch((err) => console.error("[v0] Failed to sync session:", err))
  }, [])

  const handleConsentChange = (accepted: boolean) => {
    setConsentGiven(accepted)

    // Update server
    fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent_given: accepted }),
    }).catch((err) => console.error("[v0] Failed to update consent:", err))
  }

  if (!isReady) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <TrackingProvider sessionId={sessionId} consentGiven={consentGiven}>
      <main className="min-h-screen bg-background">
        <SearchInterface sessionId={sessionId} />
        <ConsentBanner onConsentChange={handleConsentChange} />
      </main>
    </TrackingProvider>
  )
}
