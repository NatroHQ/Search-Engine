-- Add content type support for News, Videos, Images
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'web';
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS published_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS video_duration INTEGER;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS image_width INTEGER;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS image_height INTEGER;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE indexed_pages ADD COLUMN IF NOT EXISTS ai_tags TEXT[];

-- Indexes for new fields
CREATE INDEX IF NOT EXISTS idx_indexed_pages_content_type ON indexed_pages(content_type);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_published_date ON indexed_pages(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_category ON indexed_pages(category);

-- Table for AI-processed content insights
CREATE TABLE IF NOT EXISTS content_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES indexed_pages(id) ON DELETE CASCADE,
    summary TEXT,
    sentiment VARCHAR(20),
    topics TEXT[],
    entities TEXT[],
    quality_score FLOAT DEFAULT 0.0,
    spam_score FLOAT DEFAULT 0.0,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_insights_page_id ON content_insights(page_id);
CREATE INDEX IF NOT EXISTS idx_content_insights_quality ON content_insights(quality_score DESC);

-- Trending searches for news/topics
CREATE TABLE IF NOT EXISTS trending_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    search_velocity INTEGER DEFAULT 0,
    related_pages INTEGER DEFAULT 0,
    trend_score FLOAT DEFAULT 0.0,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trending_topics_score ON trending_topics(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_topic ON trending_topics(topic);
