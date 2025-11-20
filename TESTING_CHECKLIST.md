# Natro Testing Checklist

## Functionality Tests

### Search Engine
- [ ] Search returns relevant results
- [ ] Auto-suggestions appear while typing
- [ ] Content type filters work (All/News/Videos/Images)
- [ ] Pagination works correctly
- [ ] Search term highlighting appears
- [ ] Results click tracking works
- [ ] Empty query handling

### Token System
- [ ] Token balance displays correctly
- [ ] Tokens increment after searches and clicks
- [ ] Claim button enables at 1000 tokens
- [ ] Claim modal accepts Solana address
- [ ] Claim submission succeeds
- [ ] Token history is accurate

### Behavior Tracking
- [ ] Consent banner appears for new users
- [ ] Accepting consent enables tracking
- [ ] Declining consent disables tracking
- [ ] Mouse movements are captured
- [ ] Scroll events are tracked
- [ ] Journey steps are recorded
- [ ] LLM analysis runs periodically
- [ ] Quality scores are calculated
- [ ] No tracking without consent

### Crawler System
- [ ] Crawler processes queue URLs
- [ ] Content is extracted correctly
- [ ] Keywords are identified
- [ ] Links are discovered and queued
- [ ] AI categorization works
- [ ] PageRank is calculated
- [ ] Duplicate URLs are handled

### Database
- [ ] All migrations run successfully
- [ ] Full-text search indexes work
- [ ] Foreign key constraints enforced
- [ ] Session data persists
- [ ] Token balances are accurate

## Integration Tests

- [ ] Search → Click → Token award flow
- [ ] Crawler → Index → Search flow
- [ ] Consent → Track → Analyze → Reward flow
- [ ] Session creation → Tracking → Balance update

## Performance Tests

- [ ] Search responds in < 200ms
- [ ] Behavior tracking doesn't block UI
- [ ] LLM analysis completes in < 5s
- [ ] Crawler respects rate limits
- [ ] Database queries are optimized

## Security Tests

- [ ] SQL injection attempts fail
- [ ] XSS attempts are sanitized
- [ ] Rate limiting blocks rapid requests
- [ ] Bot behavior is detected
- [ ] Consent is enforced

## Browser Compatibility

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Error Handling

- [ ] Network failures are graceful
- [ ] Database errors don't crash
- [ ] Invalid input is handled
- [ ] LLM failures fall back to rules
- [ ] Missing data has defaults
