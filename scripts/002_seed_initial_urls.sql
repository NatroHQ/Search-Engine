-- Seed initial URLs for crawler to start with
INSERT INTO crawler_queue (url, priority, depth, status)
VALUES 
  ('https://en.wikipedia.org/wiki/Main_Page', 10, 0, 'pending'),
  ('https://www.github.com', 9, 0, 'pending'),
  ('https://stackoverflow.com', 9, 0, 'pending'),
  ('https://news.ycombinator.com', 8, 0, 'pending'),
  ('https://www.reddit.com', 8, 0, 'pending')
ON CONFLICT (url) DO NOTHING;
