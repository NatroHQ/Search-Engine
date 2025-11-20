"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { setConsent } from "@/lib/utils/session"

interface ConsentBannerProps {
  onConsentChange: (accepted: boolean) => void
}

export function ConsentBanner({ onConsentChange }: ConsentBannerProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("natro_consent")
    if (!consent) {
      setShow(true)
    }
  }, [])

  const handleAccept = () => {
    setConsent(true)
    onConsentChange(true)
    setShow(false)
  }

  const handleDecline = () => {
    setConsent(false)
    onConsentChange(false)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="p-6 shadow-lg border-2">
        <h3 className="font-semibold mb-2">Privacy & Data Collection</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We collect behavioral data (mouse movements, clicks, time spent, scroll patterns) to improve our search
          quality and reward genuine users with NATRO tokens. This data is analyzed by AI to calculate token rewards
          based on engagement quality. You can opt out, but you won't earn tokens.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleAccept} className="flex-1">
            Accept & Earn Tokens
          </Button>
          <Button onClick={handleDecline} variant="outline" className="flex-1 bg-transparent">
            Decline
          </Button>
        </div>
      </Card>
    </div>
  )
}
