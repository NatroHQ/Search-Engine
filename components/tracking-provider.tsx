"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BehaviorTracker } from "@/lib/tracking/behavior-tracker"
import { JourneyTracker } from "@/lib/tracking/journey-tracker"

interface TrackingProviderProps {
  children: React.ReactNode
  sessionId: string
  consentGiven: boolean
}

export function TrackingProvider({ children, sessionId, consentGiven }: TrackingProviderProps) {
  const [trackers, setTrackers] = useState<{
    behavior?: BehaviorTracker
    journey?: JourneyTracker
  }>({})

  useEffect(() => {
    if (!consentGiven) return

    // Initialize trackers
    const behaviorTracker = new BehaviorTracker(sessionId)
    const journeyTracker = new JourneyTracker(sessionId)

    behaviorTracker.start()

    setTrackers({ behavior: behaviorTracker, journey: journeyTracker })

    // Periodic analysis (every 2 minutes)
    const analysisInterval = setInterval(async () => {
      try {
        await fetch("/api/tracking/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
      } catch (error) {
        console.error("[v0] Failed to trigger analysis:", error)
      }
    }, 120000)

    return () => {
      behaviorTracker.stop()
      clearInterval(analysisInterval)
    }
  }, [sessionId, consentGiven])

  // Make trackers available globally for search/click tracking
  useEffect(() => {
    if (trackers.journey) {
      ;(window as any).__natroJourneyTracker = trackers.journey
    }
  }, [trackers])

  return <>{children}</>
}
