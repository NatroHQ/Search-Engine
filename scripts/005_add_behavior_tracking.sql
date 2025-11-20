-- Advanced user behavior tracking tables

-- User behavior tracking with mouse movements and interactions
CREATE TABLE IF NOT EXISTS user_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'mouse_move', 'click', 'scroll', 'hover', 'focus', 'blur'
    x_position INTEGER,
    y_position INTEGER,
    scroll_depth INTEGER,
    element_selector TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_behaviors_session ON user_behaviors(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_event ON user_behaviors(event_type);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_timestamp ON user_behaviors(timestamp);

-- Session time tracking and engagement metrics
CREATE TABLE IF NOT EXISTS session_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    total_time_seconds INTEGER DEFAULT 0,
    active_time_seconds INTEGER DEFAULT 0,
    idle_time_seconds INTEGER DEFAULT 0,
    pages_visited INTEGER DEFAULT 0,
    searches_performed INTEGER DEFAULT 0,
    clicks_made INTEGER DEFAULT 0,
    scroll_events INTEGER DEFAULT 0,
    average_scroll_depth FLOAT DEFAULT 0.0,
    bounce_rate FLOAT DEFAULT 0.0,
    engagement_score FLOAT DEFAULT 0.0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_metrics_session ON session_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_session_metrics_engagement ON session_metrics(engagement_score DESC);

-- User journey and path tracking
CREATE TABLE IF NOT EXISTS user_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer_url TEXT,
    action_type VARCHAR(50), -- 'search', 'click', 'navigation', 'external_link'
    action_details JSONB,
    time_on_page_seconds INTEGER DEFAULT 0,
    exit_page BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_journeys_session ON user_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_step ON user_journeys(step_number);

-- Shopping and commerce behavior tracking
CREATE TABLE IF NOT EXISTS commerce_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'product_view', 'add_to_cart', 'remove_from_cart', 'purchase', 'wishlist'
    product_url TEXT,
    product_name TEXT,
    product_category TEXT,
    product_price DECIMAL(10, 2),
    quantity INTEGER DEFAULT 1,
    cart_value DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commerce_events_session ON commerce_events(session_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_type ON commerce_events(event_type);

-- Heatmap data aggregation
CREATE TABLE IF NOT EXISTS heatmap_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_url TEXT NOT NULL,
    x_bucket INTEGER NOT NULL, -- X coordinate divided into buckets (e.g., 50px)
    y_bucket INTEGER NOT NULL, -- Y coordinate divided into buckets (e.g., 50px)
    click_count INTEGER DEFAULT 0,
    hover_count INTEGER DEFAULT 0,
    viewport_width INTEGER,
    viewport_height INTEGER,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_url, x_bucket, y_bucket, viewport_width, viewport_height)
);

CREATE INDEX IF NOT EXISTS idx_heatmap_page ON heatmap_data(page_url);
CREATE INDEX IF NOT EXISTS idx_heatmap_clicks ON heatmap_data(click_count DESC);

-- AI-powered behavior analysis
CREATE TABLE IF NOT EXISTS behavior_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'engagement', 'intent', 'quality', 'anomaly'
    insights JSONB NOT NULL,
    quality_score FLOAT DEFAULT 0.0,
    intent_prediction TEXT,
    user_segment VARCHAR(50),
    anomaly_detected BOOLEAN DEFAULT false,
    confidence_score FLOAT DEFAULT 0.0,
    processed_by VARCHAR(50) DEFAULT 'llm',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavior_insights_session ON behavior_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_insights_quality ON behavior_insights(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_insights_type ON behavior_insights(analysis_type);

-- Real-time user activity stream
CREATE TABLE IF NOT EXISTS activity_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    quality_contribution FLOAT DEFAULT 0.0,
    token_earned DECIMAL(10, 4) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_stream_session ON activity_stream(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_stream_created ON activity_stream(created_at DESC);
