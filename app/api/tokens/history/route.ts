import { type NextRequest, NextResponse } from "next/server"
import { getWalletBySessionId, getTransactionHistory } from "@/lib/database/repositories/tokens"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session_id")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 })
    }

    const wallet = await getWalletBySessionId(sessionId)

    if (!wallet) {
      return NextResponse.json({ success: true, data: [] })
    }

    const transactions = await getTransactionHistory(wallet.id)

    return NextResponse.json({
      success: true,
      data: transactions.map((tx) => ({
        id: tx.id,
        type: tx.transaction_type,
        amount: Number(tx.amount),
        actionType: tx.action_type,
        createdAt: tx.created_at,
      })),
    })
  } catch (error) {
    console.error("Transaction history error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
