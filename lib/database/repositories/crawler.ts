import { query } from "../client"
import type { CrawlerQueueItem } from "../schema"

export async function addUrlToQueue(url: string, priority = 5, depth = 0): Promise<CrawlerQueueItem> {
  const result = await query<CrawlerQueueItem>(
    `INSERT INTO crawler_queue (url, priority, depth)
     VALUES ($1, $2, $3)
     ON CONFLICT (url) DO UPDATE SET
       priority = GREATEST(crawler_queue.priority, EXCLUDED.priority),
       updated_at = NOW()
     RETURNING *`,
    [url, priority, depth],
  )
  return result[0]
}

export async function getNextUrlsToProcess(limit = 10): Promise<CrawlerQueueItem[]> {
  return query<CrawlerQueueItem>(
    `UPDATE crawler_queue
     SET status = 'processing', processed_at = NOW()
     WHERE id IN (
       SELECT id FROM crawler_queue
       WHERE status = 'pending' AND retry_count < 3
       ORDER BY priority DESC, scheduled_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [limit],
  )
}

export async function markUrlCompleted(id: string): Promise<void> {
  await query(`UPDATE crawler_queue SET status = 'completed', processed_at = NOW() WHERE id = $1`, [id])
}

export async function markUrlFailed(id: string, errorMessage: string): Promise<void> {
  await query(
    `UPDATE crawler_queue 
     SET status = 'failed', 
         error_message = $2, 
         retry_count = retry_count + 1,
         processed_at = NOW()
     WHERE id = $1`,
    [id, errorMessage],
  )
}
