# Natro Search Engine - Deployment Guide

## Prerequisites

1. **PostgreSQL Database** (version 14+)
   - Recommended: Neon, Supabase, or AWS RDS
   - Connection string format: `postgresql://user:password@host:port/database`

2. **OpenAI API Key**
   - Required for AI content processing and analysis
   - Get from: https://platform.openai.com/api-keys

3. **Node.js 20+**
   - Runtime environment

## Quick Start

### 1. Database Setup

\`\`\`bash
# Run database migrations in order
psql $DATABASE_URL -f scripts/001_create_tables.sql
psql $DATABASE_URL -f scripts/002_seed_initial_urls.sql
psql $DATABASE_URL -f scripts/003_add_content_types.sql
psql $DATABASE_URL -f scripts/004_add_token_system.sql
\`\`\`

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for content analysis

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`

### 5. Start the Crawler

In a separate terminal:

\`\`\`bash
npm run crawler
\`\`\`

This will start the continuous crawler that:
- Crawls web pages from the queue
- Analyzes content with AI
- Detects content types (web, news, video, image)
- Extracts metadata and keywords
- Stores in the database

## Production Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note:** Crawler must run separately (e.g., on a VPS or container)

### Option 2: Docker

\`\`\`bash
# Build image
docker build -t natro-search .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  natro-search
\`\`\`

### Option 3: VPS (Ubuntu/Debian)

\`\`\`bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/NatroHQ/natro-search.git
cd natro-search

# Install dependencies
npm ci

# Build
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start web server
pm2 start npm --name "natro-web" -- start

# Start crawler
pm2 start "node scripts/run-enhanced-crawler.ts" --name "natro-crawler"

# Save PM2 configuration
pm2 save
pm2 startup
\`\`\`

## System Architecture

### Components

1. **Web Application** (Next.js)
   - Search interface
   - API endpoints
   - Token reward system

2. **Database** (PostgreSQL)
   - Indexed pages
   - Keywords and links
   - User sessions and analytics
   - Token wallets and claims

3. **Crawler** (Background Process)
   - Continuous web crawling
   - AI content analysis
   - Content type detection
   - Automatic database updates

4. **AI Processor** (OpenAI GPT-4)
   - Content summarization
   - Sentiment analysis
   - Category detection
   - Quality scoring

## Monitoring

### Health Check

\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

### View Crawler Logs

\`\`\`bash
pm2 logs natro-crawler
\`\`\`

### Database Statistics

\`\`\`sql
-- Total indexed pages
SELECT COUNT(*) FROM indexed_pages;

-- Pages by content type
SELECT content_type, COUNT(*) FROM indexed_pages GROUP BY content_type;

-- Recent crawl activity
SELECT COUNT(*) FROM crawler_queue WHERE status = 'completed' 
  AND completed_at > NOW() - INTERVAL '1 hour';
\`\`\`

## Token System

### Earning Rates
- **0.10 NATRO** per search
- **0.05 NATRO** per click
- **1000 NATRO** minimum to claim

### Daily Limits
- 100 searches per session per day
- 200 clicks per session per day

### Claim Process
1. User reaches 1000+ tokens
2. Provides Solana wallet address
3. Claim request created (status: pending)
4. Admin processes claim within 24 hours
5. Tokens sent to wallet (requires Solana contract implementation)

## Scaling Recommendations

### Database
- Use connection pooling (configured in `lib/database/client.ts`)
- Add read replicas for search queries
- Implement database indexing optimization

### Crawler
- Run multiple crawler instances with different seed URLs
- Implement distributed queue system (Redis/RabbitMQ)
- Rate limit per domain to avoid blocking

### Caching
- Add Redis for search result caching
- Cache popular queries for 5-10 minutes
- Cache token balances for 30 seconds

### CDN
- Serve static assets through CDN
- Cache API responses at edge
- Use geographic distribution

## Troubleshooting

### Crawler Not Processing URLs

\`\`\`bash
# Check queue status
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM crawler_queue GROUP BY status;"

# Reset failed URLs
psql $DATABASE_URL -c "UPDATE crawler_queue SET status = 'pending', attempts = 0 WHERE status = 'failed' AND attempts < 3;"
\`\`\`

### Search Returns No Results

\`\`\`bash
# Check if pages are indexed
psql $DATABASE_URL -c "SELECT COUNT(*) FROM indexed_pages WHERE status = 'active';"

# Reindex if needed
psql $DATABASE_URL -c "UPDATE indexed_pages SET status = 'active' WHERE status = 'inactive';"
\`\`\`

### Token System Not Working

\`\`\`bash
# Check earning rates
psql $DATABASE_URL -c "SELECT * FROM earning_rates;"

# If empty, seed data
psql $DATABASE_URL -f scripts/004_add_token_system.sql
\`\`\`

## Security Considerations

1. **API Rate Limiting** - Implemented in `middleware.ts`
2. **SQL Injection Prevention** - Using parameterized queries
3. **XSS Protection** - React auto-escaping + CSP headers
4. **Session Security** - HTTP-only cookies with secure flag
5. **Database Access** - Use read-only user for search queries

## Performance Benchmarks

Target metrics:
- **Search Response Time**: < 200ms
- **Crawler Speed**: 5-10 pages/second
- **Database Queries**: < 50ms average
- **Token API Response**: < 100ms

## Support

For issues or questions:
- GitHub Issues: https://github.com/NatroHQ/natro-search/issues
- Documentation: https://search.natro.io/docs
