import { query } from "../client"
import type { UserWallet, TokenTransaction, TokenClaim, TokenEarningRate } from "../schema"

export async function getOrCreateWallet(sessionId: string): Promise<UserWallet> {
  const result = await query<UserWallet>(
    `INSERT INTO user_wallets (session_id)
     VALUES ($1)
     ON CONFLICT (session_id) 
     DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [sessionId],
  )
  return result[0]
}

export async function getWalletBySessionId(sessionId: string): Promise<UserWallet | null> {
  const result = await query<UserWallet>(`SELECT * FROM user_wallets WHERE session_id = $1`, [sessionId])
  return result[0] || null
}

export async function updateWalletAddress(walletId: string, solanaAddress: string): Promise<UserWallet> {
  const result = await query<UserWallet>(
    `UPDATE user_wallets 
     SET solana_address = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [solanaAddress, walletId],
  )
  return result[0]
}

export async function earnTokens(data: {
  walletId: string
  amount: number
  actionType: string
  metadata?: Record<string, unknown>
}): Promise<TokenTransaction> {
  const client = await query("BEGIN")

  try {
    await query(
      `UPDATE user_wallets 
       SET token_balance = token_balance + $1,
           total_earned = total_earned + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [data.amount, data.walletId],
    )

    const result = await query<TokenTransaction>(
      `INSERT INTO token_transactions 
       (wallet_id, transaction_type, amount, action_type, metadata)
       VALUES ($1, 'earn', $2, $3, $4)
       RETURNING *`,
      [data.walletId, data.amount, data.actionType, JSON.stringify(data.metadata || {})],
    )

    await query("COMMIT")
    return result[0]
  } catch (error) {
    await query("ROLLBACK")
    throw error
  }
}

export async function createTokenClaim(walletId: string, amount: number, solanaAddress: string): Promise<TokenClaim> {
  const result = await query<TokenClaim>(
    `INSERT INTO token_claims 
     (wallet_id, amount, solana_address, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [walletId, amount, solanaAddress],
  )
  return result[0]
}

export async function processClaim(claimId: string, transactionHash: string): Promise<TokenClaim> {
  const client = await query("BEGIN")

  try {
    const claim = await query<TokenClaim>(`SELECT * FROM token_claims WHERE id = $1`, [claimId])

    if (!claim[0]) {
      throw new Error("Claim not found")
    }

    await query(
      `UPDATE user_wallets 
       SET token_balance = token_balance - $1,
           total_claimed = total_claimed + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [claim[0].amount, claim[0].wallet_id],
    )

    await query<TokenTransaction>(
      `INSERT INTO token_transactions 
       (wallet_id, transaction_type, amount, action_type, metadata)
       VALUES ($1, 'claim', $2, 'withdrawal', $3)`,
      [claim[0].wallet_id, -claim[0].amount, JSON.stringify({ claim_id: claimId, tx_hash: transactionHash })],
    )

    const result = await query<TokenClaim>(
      `UPDATE token_claims 
       SET status = 'completed',
           transaction_hash = $1,
           processed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [transactionHash, claimId],
    )

    await query("COMMIT")
    return result[0]
  } catch (error) {
    await query("ROLLBACK")
    throw error
  }
}

export async function getEarningRate(actionType: string): Promise<TokenEarningRate | null> {
  const result = await query<TokenEarningRate>(
    `SELECT * FROM token_earning_rates WHERE action_type = $1 AND enabled = true`,
    [actionType],
  )
  return result[0] || null
}

export async function checkDailyLimit(walletId: string, actionType: string): Promise<boolean> {
  const rate = await getEarningRate(actionType)
  if (!rate || !rate.daily_limit) return true

  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM token_transactions
     WHERE wallet_id = $1 
     AND action_type = $2 
     AND transaction_type = 'earn'
     AND created_at >= CURRENT_DATE`,
    [walletId, actionType],
  )

  const count = Number.parseInt(result[0]?.count || "0", 10)
  return count < rate.daily_limit
}

export async function getTransactionHistory(walletId: string, limit = 50): Promise<TokenTransaction[]> {
  return query<TokenTransaction>(
    `SELECT * FROM token_transactions 
     WHERE wallet_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [walletId, limit],
  )
}

export async function getPendingClaims(walletId: string): Promise<TokenClaim[]> {
  return query<TokenClaim>(
    `SELECT * FROM token_claims 
     WHERE wallet_id = $1 
     AND status IN ('pending', 'processing')
     ORDER BY created_at DESC`,
    [walletId],
  )
}

export async function awardTokens(
  sessionId: string,
  amount: number,
  actionType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    // Get or create wallet for this session
    const wallet = await getOrCreateWallet(sessionId)

    // Award tokens
    await earnTokens({
      walletId: wallet.id,
      amount,
      actionType,
      metadata,
    })
  } catch (error) {
    console.error("[v0] Failed to award tokens:", error)
    throw error
  }
}
