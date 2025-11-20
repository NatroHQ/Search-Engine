import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Service unavailable in demo mode",
        },
        { status: 503 },
      )
    }

    const sessionId = request.cookies.get("natro_session")?.value

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { solana_address } = body

    if (!solana_address || typeof solana_address !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Valid Solana address is required",
        },
        { status: 400 },
      )
    }

    if (solana_address.length < 32 || solana_address.length > 44) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Solana address format",
        },
        { status: 400 },
      )
    }

    try {
      const { getWalletBySessionId, createTokenClaim, updateWalletAddress } = await import(
        "@/lib/database/repositories/tokens"
      )

      const wallet = await getWalletBySessionId(sessionId)

      if (!wallet) {
        return NextResponse.json(
          {
            success: false,
            error: "Wallet not found",
          },
          { status: 404 },
        )
      }

      const balance = Number(wallet.token_balance)

      if (balance < 1000) {
        return NextResponse.json(
          {
            success: false,
            error: "Minimum 1000 tokens required to claim",
          },
          { status: 400 },
        )
      }

      if (!wallet.solana_address) {
        await updateWalletAddress(wallet.id, solana_address)
      }

      const claim = await createTokenClaim(wallet.id, balance, solana_address)

      return NextResponse.json({
        success: true,
        data: {
          claimId: claim.id,
          amount: Number(claim.amount),
          status: claim.status,
          message: "Claim request submitted. Tokens will be sent to your wallet within 24 hours.",
        },
      })
    } catch (dbError) {
      console.error("[v0] Database claim error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database operation failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Token claim error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
