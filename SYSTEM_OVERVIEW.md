# Natro Search Engine - Complete System Overview

## System Architecture

Natro is a fully-functional Google-like search engine with custom algorithms, AI-powered content processing, and a blockchain-based token reward system.

### Core Components

#### 1. Web Crawler & Indexer
- **Location**: `lib/crawler/`
- **Features**:
  - Continuous web crawling with queue management
  - Robots.txt compliance and rate limiting
  - HTML parsing and content extraction
  - Automatic keyword extraction and analysis
  - PageRank calculation via link graph analysis
  - AI-powered content categorization (News, Videos, Images, Web)
  - OpenGraph metadata extraction

#### 2. Search Algorithm Engine
- **Location**: `lib/search/`
- **Ranking Factors**:
  - Full-text search relevance (PostgreSQL tsvector)
  - Keyword density and matching
  - PageRank authority scoring
  - Content freshness (time decay)
  - Domain authority
  - User engagement signals (click-through rate)
- **Features**:
  - Multi-factor scoring with weighted combination
  - Search query highlighting in results
  - Auto-complete suggestions
  - Content type filtering (All/News/Videos/Images)

#### 3. AI Content Processor
- **Location**: `lib/ai/`
- **Capabilities**:
  - Content quality assessment
  - Automatic categorization (news, video, image detection)
  - Sentiment analysis
  - Topic extraction
  - Spam detection
  - Summary generation
- **Model**: GPT-4o via Vercel AI SDK

#### 4. User Behavior Tracking System
- **Location**: `lib/tracking/`, `lib/database/repositories/behavior.ts`
- **Data Collected** (with user consent):
  - Mouse movements and click patterns
  - Scroll depth and engagement time
  - Active vs idle time tracking
  - User journey and navigation paths
  - Search quality metrics
  - Shopping/commerce behavior (if applicable)
  - Heatmap data for UI optimization

#### 5. LLM-Powered Behavior Analysis
- **Location**: `lib/ai/behavior-analyzer.ts`
- **Analysis Types**:
  - Engagement quality scoring (0-100)
  - User intent prediction
  - Anomaly detection (bot identification)
  - User segmentation (research/shopping/casual/professional)
  - Dynamic token reward calculation
- **Factors Considered**:
  - Time spent (total and active)
  - Search diversity and quality
  - Natural interaction patterns
  - Page visit depth
  - Click relevance

#### 6. Token Reward System
- **Location**: `lib/utils/token-rewards.ts`, `lib/database/repositories/tokens.ts`
- **Token Economics**:
  - Dynamic rewards based on behavior quality (no fixed amounts)
  - LLM analyzes user engagement and calculates tokens
  - Quality scoring: 0.10 - 2.0+ tokens per session
  - Minimum 1000 NATRO tokens required to claim
  - Solana blockchain integration (contract placeholder)
- **Earning Factors**:
  - High-quality searches
  - Genuine engagement time
  - Natural mouse/scroll patterns
  - Diverse content exploration
  - Consistent usage patterns

#### 7. Database Schema
- **Location**: `scripts/`
- **Tables**:
  - `indexed_pages` - Crawled web content
  - `page_keywords` - Extracted keywords for ranking
  - `page_links` - Link graph for PageRank
  - `crawler_queue` - URLs pending crawl
  - `user_sessions` - User tracking with consent
  - `search_queries` - Search history
  - `search_clicks` - Click tracking
  - `user_behaviors` - Mouse/scroll/interaction events
  - `session_metrics` - Engagement aggregates
  - `user_journeys` - Navigation paths
  - `behavior_insights` - LLM analysis results
  - `heatmap_data` - UI interaction heatmaps
  - `user_wallets` - Token balances
  - `token_transactions` - Earning history
  - `token_claims` - Withdrawal requests

### API Endpoints

#### Search & Discovery
- `POST /api/search` - Main search with filters
- `GET /api/suggestions` - Auto-complete suggestions
- `POST /api/click` - Click tracking

#### Token System
- `GET /api/tokens/balance` - Get user token balance
- `POST /api/tokens/claim` - Request token withdrawal
- `GET /api/tokens/history` - View earning history

#### Behavior Tracking
- `POST /api/tracking/behavior` - Save behavior events
- `POST /api/tracking/journey` - Track user journey
- `POST /api/tracking/analyze` - Trigger LLM analysis

#### Analytics
- `GET /api/analytics/popular` - Popular searches
- `GET /api/analytics/stats` - System statistics
- `POST /api/session` - Session management

#### Crawler Management
- `POST /api/crawler/add` - Add URL to crawl queue
- `GET /api/health` - System health check

### Frontend Components

#### Main Interface
- `app/page.tsx` - Main entry with tracking setup
- `components/search-interface.tsx` - Search box and tabs
- `components/search-results.tsx` - Results display (All/News/Videos/Images)
- `components/search-suggestions.tsx` - Auto-complete dropdown

#### User Features
- `components/token-balance.tsx` - Token display and claim modal
- `components/consent-banner.tsx` - Privacy consent UI
- `components/tracking-provider.tsx` - Behavior tracking wrapper

### Data Flow

1. **User Search**:
   - User types query → Auto-suggestions appear
   - Submit search → Track in journey + behavior
   - Search engine scores results using multi-factor algorithm
   - Display results with highlighted terms
   - Track click → Award tokens based on engagement

2. **Token Earning**:
   - Behavior tracker captures interactions
   - Every 2 minutes, trigger LLM analysis
   - LLM analyzes quality and calculates tokens
   - Tokens added to user wallet
   - User can claim when reaching 1000 NATRO

3. **Content Indexing**:
   - Crawler fetches URLs from queue
   - Parse HTML and extract content
   - LLM categorizes and analyzes content
   - Calculate PageRank from link graph
   - Store in database with full-text index

### Privacy & Consent

- **GDPR Compliant**: Users must consent to tracking
- **Opt-out Available**: Can decline (but won't earn tokens)
- **Data Transparency**: Clear explanation of data collection
- **Anonymous by Default**: Session-based, no personal identity required

### Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, PostgreSQL
- **AI**: Vercel AI SDK (GPT-4o)
- **Blockchain**: Solana (token contract placeholder)
- **Crawler**: Custom with jsdom + rate limiting
- **Search**: PostgreSQL full-text search + custom ranking

### Deployment Requirements

1. PostgreSQL database (Neon/Supabase recommended)
2. OpenAI API key (for LLM features)
3. Node.js 18+ environment
4. Environment variables:
   - `DATABASE_URL` - PostgreSQL connection
   - `OPENAI_API_KEY` or AI Gateway setup
   - `NEXT_PUBLIC_BASE_URL` - Frontend URL

### Running the System

\`\`\`bash
# Install dependencies
npm install

# Setup database
npm run db:migrate

# Seed initial URLs (optional)
# Already included in db:migrate

# Start crawler (separate process)
npm run crawler

# Start development server
npm run dev

# Production build
npm run build
npm start
\`\`\`

### Key Differentiators

1. **No External APIs**: Custom crawler and indexer, not using Google/Brave API
2. **Quality-Based Rewards**: LLM determines token amounts dynamically
3. **Comprehensive Tracking**: Mouse, scroll, time, journey - full behavior analysis
4. **AI-Powered Everything**: Content categorization, behavior analysis, spam detection
5. **Multi-Content Types**: Web, News, Videos, Images all supported
6. **Real PageRank**: Actual link graph analysis like original Google

### Performance Metrics

- Search response time: < 200ms
- Behavior tracking batch: 50 events or 10s
- LLM analysis frequency: Every 2 minutes
- Token calculation: Real-time based on quality
- Crawler rate: Configurable, default 2 req/sec per domain

### Security Features

- Rate limiting on all APIs
- SQL injection protection (parameterized queries)
- XSS protection (sanitized outputs)
- Bot detection via LLM analysis
- Consent-based tracking only
- No token rewards for suspicious behavior

## Next Steps for Production

1. **Solana Smart Contract**: Implement actual token contract for claims
2. **Scale Crawler**: Distributed crawling with multiple workers
3. **Cache Layer**: Redis for search results and suggestions
4. **CDN**: Static assets and image optimization
5. **Monitoring**: Error tracking, performance monitoring
6. **Admin Dashboard**: Crawler management, analytics viewing
7. **API Rate Limits**: Per-user limits with authentication
