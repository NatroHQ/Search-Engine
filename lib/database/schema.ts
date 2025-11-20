export interface IndexedPage {
  id: string
  url: string
  title: string | null
  description: string | null
  content: string | null
  language: string | null
  favicon_url: string | null
  domain: string | null
  path: string | null
  crawled_at: Date
  last_indexed_at: Date
  status: "active" | "inactive" | "error"
  page_rank: number
  word_count: number
  content_type: "web" | "news" | "video" | "image"
  published_date: Date | null
  author: string | null
  image_url: string | null
  video_url: string | null
  video_duration: number | null
  image_width: number | null
  image_height: number | null
  thumbnail_url: string | null
  category: string | null
  ai_summary: string | null
  ai_tags: string[] | null
  created_at: Date
  updated_at: Date
}

export interface PageKeyword {
  id: string
  page_id: string
  keyword: string
  frequency: number
  relevance_score: number
  created_at: Date
}

export interface PageLink {
  id: string
  source_page_id: string
  target_url: string
  anchor_text: string | null
  link_type: "internal" | "external"
  created_at: Date
}

export interface CrawlerQueueItem {
  id: string
  url: string
  priority: number
  depth: number
  status: "pending" | "processing" | "completed" | "failed"
  error_message: string | null
  retry_count: number
  scheduled_at: Date
  processed_at: Date | null
  created_at: Date
}

export interface UserSession {
  id: string
  session_id: string
  ip_address: string | null
  user_agent: string | null
  country: string | null
  city: string | null
  consent_given: boolean
  first_seen_at: Date
  last_seen_at: Date
  created_at: Date
}

export interface SearchQuery {
  id: string
  session_id: string | null
  query: string
  results_count: number
  page_number: number
  response_time_ms: number | null
  ip_address: string | null
  user_agent: string | null
  created_at: Date
}

export interface SearchClick {
  id: string
  query_id: string
  page_id: string | null
  clicked_url: string
  position: number | null
  created_at: Date
}

export interface PopularSearch {
  id: string
  query: string
  search_count: number
  last_searched_at: Date
  created_at: Date
}

export interface ContentInsight {
  id: string
  page_id: string
  summary: string | null
  sentiment: string | null
  topics: string[] | null
  entities: string[] | null
  quality_score: number
  spam_score: number
  processed_at: Date
  created_at: Date
}

export interface TrendingTopic {
  id: string
  topic: string
  search_velocity: number
  related_pages: number
  trend_score: number
  first_seen_at: Date
  last_updated_at: Date
  created_at: Date
}

export interface UserWallet {
  id: string
  session_id: string
  solana_address: string | null
  token_balance: number
  total_earned: number
  total_claimed: number
  created_at: Date
  updated_at: Date
}

export interface TokenTransaction {
  id: string
  wallet_id: string
  transaction_type: "earn" | "claim" | "bonus"
  amount: number
  action_type: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
}

export interface TokenClaim {
  id: string
  wallet_id: string
  amount: number
  solana_address: string
  transaction_hash: string | null
  status: "pending" | "processing" | "completed" | "failed"
  error_message: string | null
  requested_at: Date
  processed_at: Date | null
  created_at: Date
}

export interface TokenEarningRate {
  id: string
  action_type: string
  tokens_per_action: number
  daily_limit: number | null
  description: string | null
  enabled: boolean
  created_at: Date
  updated_at: Date
}

export interface UserBehavior {
  id: string
  session_id: string
  page_url: string
  event_type: "mouse_move" | "click" | "scroll" | "hover" | "focus" | "blur"
  x_position: number | null
  y_position: number | null
  scroll_depth: number | null
  element_selector: string | null
  viewport_width: number | null
  viewport_height: number | null
  timestamp: number
  created_at: Date
}

export interface SessionMetrics {
  id: string
  session_id: string
  total_time_seconds: number
  active_time_seconds: number
  idle_time_seconds: number
  pages_visited: number
  searches_performed: number
  clicks_made: number
  scroll_events: number
  average_scroll_depth: number
  bounce_rate: number
  engagement_score: number
  last_activity_at: Date
  created_at: Date
  updated_at: Date
}

export interface UserJourney {
  id: string
  session_id: string
  step_number: number
  page_url: string
  page_title: string | null
  referrer_url: string | null
  action_type: "search" | "click" | "navigation" | "external_link" | null
  action_details: Record<string, unknown> | null
  time_on_page_seconds: number
  exit_page: boolean
  created_at: Date
}

export interface CommerceEvent {
  id: string
  session_id: string
  event_type: "product_view" | "add_to_cart" | "remove_from_cart" | "purchase" | "wishlist"
  product_url: string | null
  product_name: string | null
  product_category: string | null
  product_price: number | null
  quantity: number
  cart_value: number | null
  currency: string
  metadata: Record<string, unknown> | null
  created_at: Date
}

export interface HeatmapData {
  id: string
  page_url: string
  x_bucket: number
  y_bucket: number
  click_count: number
  hover_count: number
  viewport_width: number | null
  viewport_height: number | null
  last_updated_at: Date
  created_at: Date
}

export interface BehaviorInsight {
  id: string
  session_id: string
  analysis_type: "engagement" | "intent" | "quality" | "anomaly"
  insights: Record<string, unknown>
  quality_score: number
  intent_prediction: string | null
  user_segment: string | null
  anomaly_detected: boolean
  confidence_score: number
  processed_by: string
  processed_at: Date
  created_at: Date
}

export interface ActivityStream {
  id: string
  session_id: string
  activity_type: string
  description: string | null
  metadata: Record<string, unknown> | null
  quality_contribution: number
  token_earned: number
  created_at: Date
}
