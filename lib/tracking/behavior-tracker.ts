// Client-side behavior tracking system

interface BehaviorEvent {
  type: "mouse_move" | "click" | "scroll" | "hover" | "focus" | "blur"
  x?: number
  y?: number
  scrollDepth?: number
  elementSelector?: string
  timestamp: number
}

class BehaviorTracker {
  private sessionId: string
  private events: BehaviorEvent[] = []
  private isTracking = false
  private batchSize = 50
  private flushInterval = 10000 // 10 seconds
  private lastFlush = Date.now()
  private mousePositions: Array<{ x: number; y: number; t: number }> = []
  private pageStartTime = Date.now()
  private activeTime = 0
  private lastActiveTime = Date.now()
  private idleTimeout: NodeJS.Timeout | null = null

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  start() {
    if (this.isTracking) return
    this.isTracking = true

    // Mouse movement tracking (throttled)
    let lastMouseTrack = 0
    document.addEventListener("mousemove", (e) => {
      const now = Date.now()
      if (now - lastMouseTrack > 100) {
        // Track every 100ms
        this.trackEvent({
          type: "mouse_move",
          x: e.clientX,
          y: e.clientY,
          timestamp: now,
        })
        this.mousePositions.push({ x: e.clientX, y: e.clientY, t: now })
        if (this.mousePositions.length > 100) {
          this.mousePositions.shift()
        }
        lastMouseTrack = now
        this.updateActiveTime()
      }
    })

    // Click tracking
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement
      this.trackEvent({
        type: "click",
        x: e.clientX,
        y: e.clientY,
        elementSelector: this.getElementSelector(target),
        timestamp: Date.now(),
      })
      this.updateActiveTime()
    })

    // Scroll tracking
    let lastScrollTrack = 0
    document.addEventListener("scroll", () => {
      const now = Date.now()
      if (now - lastScrollTrack > 200) {
        const scrollDepth = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
        )
        this.trackEvent({
          type: "scroll",
          scrollDepth,
          timestamp: now,
        })
        lastScrollTrack = now
        this.updateActiveTime()
      }
    })

    // Focus/Blur tracking for tab switching
    window.addEventListener("focus", () => {
      this.trackEvent({ type: "focus", timestamp: Date.now() })
      this.lastActiveTime = Date.now()
    })

    window.addEventListener("blur", () => {
      this.trackEvent({ type: "blur", timestamp: Date.now() })
      this.updateActiveTime()
    })

    // Periodic flush
    setInterval(() => this.flush(), this.flushInterval)

    // Flush on page unload
    window.addEventListener("beforeunload", () => {
      this.flush(true)
    })
  }

  private updateActiveTime() {
    const now = Date.now()
    const timeSinceLastActive = now - this.lastActiveTime

    if (timeSinceLastActive < 5000) {
      // Consider active if less than 5 seconds idle
      this.activeTime += timeSinceLastActive
    }

    this.lastActiveTime = now

    // Reset idle timeout
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
    }
    this.idleTimeout = setTimeout(() => {
      this.flush()
    }, 30000) // Flush after 30 seconds of inactivity
  }

  private trackEvent(event: BehaviorEvent) {
    this.events.push(event)

    if (this.events.length >= this.batchSize) {
      this.flush()
    }
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`
    if (element.className) return `.${element.className.split(" ")[0]}`
    return element.tagName.toLowerCase()
  }

  async flush(immediate = false) {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    const sessionData = {
      sessionId: this.sessionId,
      events: eventsToSend,
      metrics: {
        totalTime: Math.floor((Date.now() - this.pageStartTime) / 1000),
        activeTime: Math.floor(this.activeTime / 1000),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        url: window.location.href,
      },
    }

    try {
      if (immediate && navigator.sendBeacon) {
        navigator.sendBeacon("/api/tracking/behavior", JSON.stringify(sessionData))
      } else {
        await fetch("/api/tracking/behavior", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData),
        })
      }
    } catch (error) {
      console.error("[v0] Failed to send behavior data:", error)
    }

    this.lastFlush = Date.now()
  }

  stop() {
    this.isTracking = false
    this.flush(true)
  }
}

export { BehaviorTracker }
