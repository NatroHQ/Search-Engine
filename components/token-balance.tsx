"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Coins, Wallet, TrendingUp, Clock } from "lucide-react"

interface TokenData {
  balance: number
  totalEarned: number
  totalClaimed: number
  canClaim: boolean
  solanaAddress?: string
  demoMode?: boolean
  error?: string
}

interface TokenBalanceProps {
  sessionId: string
}

export function TokenBalance({ sessionId }: TokenBalanceProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showClaimModal, setShowClaimModal] = useState(false)

  useEffect(() => {
    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchBalance() {
    try {
      const response = await fetch("/api/tokens/balance")
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Non-JSON response from balance API")
        setTokenData({
          balance: 0,
          totalEarned: 0,
          totalClaimed: 0,
          canClaim: false,
          error: "Service unavailable",
        })
        setLoading(false)
        return
      }

      const data = await response.json()
      if (data.success) {
        setTokenData(data.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch balance:", error)
      setTokenData({
        balance: 0,
        totalEarned: 0,
        totalClaimed: 0,
        canClaim: false,
        error: "Connection failed",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!tokenData) return null

  return (
    <>
      <Card className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <div>
            <div className="text-lg font-bold text-foreground">{tokenData.balance.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">NATRO</div>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">{tokenData.totalEarned.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">{tokenData.totalClaimed.toFixed(2)}</span>
          </div>
        </div>

        <Button
          size="sm"
          disabled={!tokenData.canClaim || !!tokenData.demoMode || !!tokenData.error}
          onClick={() => setShowClaimModal(true)}
          className="ml-auto"
        >
          {tokenData.demoMode || tokenData.error
            ? "Demo Mode"
            : tokenData.canClaim
              ? "Claim Tokens"
              : `${(1000 - tokenData.balance).toFixed(0)} more to claim`}
        </Button>
      </Card>

      {showClaimModal && (
        <ClaimModal
          balance={tokenData.balance}
          solanaAddress={tokenData.solanaAddress}
          onClose={() => setShowClaimModal(false)}
          onSuccess={fetchBalance}
        />
      )}
    </>
  )
}

function ClaimModal({
  balance,
  solanaAddress,
  onClose,
  onSuccess,
}: {
  balance: number
  solanaAddress?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [address, setAddress] = useState(solanaAddress || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleClaim() {
    if (!address || address.length < 32) {
      setError("Please enter a valid Solana address")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/tokens/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solana_address: address }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 3000)
      } else {
        setError(data.error || "Failed to claim tokens")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Claim NATRO Tokens</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {success ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold">Claim Submitted!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your {balance.toFixed(2)} NATRO tokens will be sent to your wallet within 24 hours.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Amount to claim</span>
                <span className="text-lg font-bold">{balance.toFixed(2)} NATRO</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Solana Wallet Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your Solana wallet address"
                className="w-full px-3 py-2 border rounded-lg bg-background"
                disabled={loading}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Token claims are processed within 24 hours. Make sure your Solana address is correct as this cannot be
                changed after submission.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleClaim} className="flex-1" disabled={loading}>
                {loading ? "Processing..." : "Claim Tokens"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
