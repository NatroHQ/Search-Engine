// User journey and path tracking

interface JourneyStep {
  pageUrl: string
  pageTitle: string
  referrer: string
  actionType: "search" | "click" | "navigation" | "external_link"
  actionDetails: Record<string, unknown>
  timestamp: number
}

class JourneyTracker {
  private sessionId: string
  private currentStep = 0
  private entryTime = Date.now()

  constructor(sessionId: string) {
    this.sessionId = sessionId
    this.trackPageEntry()
  }

  private trackPageEntry() {
    this.trackStep({
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      actionType: "navigation",
      actionDetails: {
        entryPoint: !document.referrer || document.referrer === "",
      },
      timestamp: Date.now(),
    })
  }

  trackSearch(query: string, resultsCount: number) {
    this.trackStep({
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      actionType: "search",
      actionDetails: { query, resultsCount },
      timestamp: Date.now(),
    })
  }

  trackClick(url: string, position?: number) {
    this.trackStep({
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      actionType: "click",
      actionDetails: { targetUrl: url, position },
      timestamp: Date.now(),
    })
  }

  private async trackStep(step: JourneyStep) {
    const timeOnPreviousPage = Math.floor((Date.now() - this.entryTime) / 1000)

    try {
      await fetch("/api/tracking/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.sessionId,
          stepNumber: this.currentStep++,
          ...step,
          timeOnPage: timeOnPreviousPage,
        }),
      })

      this.entryTime = Date.now()
    } catch (error) {
      console.error("[v0] Failed to track journey:", error)
    }
  }
}

export { JourneyTracker }
