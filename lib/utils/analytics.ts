export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (typeof window === "undefined") return

  const consent = localStorage.getItem("natro_consent")
  if (consent !== "accepted") return

  try {
    const sessionId = localStorage.getItem("natro_session_id")

    console.log("[Analytics]", event.event, event.properties)
  } catch (error) {
    console.error("Analytics tracking failed:", error)
  }
}

export async function trackSearch(query: string, resultsCount: number): Promise<void> {
  await trackEvent({
    event: "search",
    properties: {
      query,
      resultsCount,
      timestamp: new Date().toISOString(),
    },
  })
}

export async function trackClick(url: string, position: number): Promise<void> {
  await trackEvent({
    event: "click",
    properties: {
      url,
      position,
      timestamp: new Date().toISOString(),
    },
  })
}

export async function trackPageView(page: string): Promise<void> {
  await trackEvent({
    event: "pageview",
    properties: {
      page,
      timestamp: new Date().toISOString(),
    },
  })
}
