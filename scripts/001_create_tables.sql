-- Natro Search Engine Database Schema
-- Indexed web pages and content
CREATE TABLE IF NOT EXISTS indexed_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    content TEXT,
    language VARCHAR(10),
    favicon_url TEXT,
    domain VARCHAR(255),
    path TEXT,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active',
    page_rank FLOAT DEFAULT 0.0,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Full-text search index for content
CREATE INDEX IF NOT EXISTS idx_indexed_pages_content ON indexed_pages USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_indexed_pages_title ON indexed_pages USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_indexed_pages_url ON indexed_pages(url);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_domain ON indexed_pages(domain);
CREATE INDEX IF NOT EXISTS idx_indexed_pages_status ON indexed_pages(status);

-- Keywords and terms extracted from pages
CREATE TABLE IF NOT EXISTS page_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES indexed_pages(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    relevance_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_keywords_keyword ON page_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_page_keywords_page_id ON page_keywords(page_id);

-- Outbound links from indexed pages
CREATE TABLE IF NOT EXISTS page_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_page_id UUID REFERENCES indexed_pages(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    anchor_text TEXT,
    link_type VARCHAR(20) DEFAULT 'internal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_links_source ON page_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_page_links_target ON page_links(target_url);

-- Crawler queue for URLs to be processed
CREATE TABLE IF NOT EXISTS crawler_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    priority INTEGER DEFAULT 5,
    depth INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawler_queue_status ON crawler_queue(status);
CREATE INDEX IF NOT EXISTS idx_crawler_queue_priority ON crawler_queue(priority DESC);

-- User sessions and analytics
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    consent_given BOOLEAN DEFAULT false,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_consent ON user_sessions(consent_given);

-- Search queries from users
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    page_number INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_session ON search_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);

-- Click tracking for search results
CREATE TABLE IF NOT EXISTS search_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES search_queries(id) ON DELETE CASCADE,
    page_id UUID REFERENCES indexed_pages(id) ON DELETE SET NULL,
    clicked_url TEXT NOT NULL,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_clicks_query ON search_clicks(query_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_page ON search_clicks(page_id);

-- Popular searches aggregation
CREATE TABLE IF NOT EXISTS popular_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT UNIQUE NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_query ON popular_searches(query);
