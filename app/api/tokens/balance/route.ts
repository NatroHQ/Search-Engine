import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Wrap everything in try-catch to ensure JSON response
  try {
    // Check if database is configured first
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: {
          balance: 0,
          totalEarned: 0,
          totalClaimed: 0,
          canClaim: false,
          demoMode: true,
        },
      })
    }

    const sessionId = request.cookies.get("natro_session")?.value

    if (!sessionId) {
      return NextResponse.json({
        success: true,
        data: {
          balance: 0,
          totalEarned: 0,
          totalClaimed: 0,
          canClaim: false,
        },
      })
    }

    // Dynamically import to catch import errors
    try {
      const { getOrCreateWallet } = await import("@/lib/database/repositories/tokens")
      const wallet = await getOrCreateWallet(sessionId)

      return NextResponse.json({
        success: true,
        data: {
          balance: Number(wallet.token_balance),
          totalEarned: Number(wallet.total_earned),
          totalClaimed: Number(wallet.total_claimed),
          canClaim: Number(wallet.token_balance) >= 1000,
          solanaAddress: wallet.solana_address,
        },
      })
    } catch (dbError) {
      console.error("Database operation failed:", dbError)
      // Return demo mode if database fails
      return NextResponse.json({
        success: true,
        data: {
          balance: 0,
          totalEarned: 0,
          totalClaimed: 0,
          canClaim: false,
          demoMode: true,
          error: "Database connection failed",
        },
      })
    }
  } catch (error) {
    console.error("Balance API error:", error)
    // Always return valid JSON
    return NextResponse.json({
      success: true,
      data: {
        balance: 0,
        totalEarned: 0,
        totalClaimed: 0,
        canClaim: false,
        demoMode: true,
      },
    })
  }
}
