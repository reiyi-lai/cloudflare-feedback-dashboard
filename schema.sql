-- Feedback Dashboard Schema
-- D1 Database for aggregating product feedback from multiple sources

-- Drop table if exists (for clean re-runs)
DROP TABLE IF EXISTS feedback;

-- Main feedback table
CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,           -- discord, github, twitter, support, email, forum
    author TEXT,                    -- username or email
    content TEXT NOT NULL,          -- the actual feedback text
    created_at TEXT DEFAULT (datetime('now')),
    sentiment TEXT,                 -- positive, neutral, negative (AI-analyzed)
    sentiment_score INTEGER,        -- 0-100 score (0=very negative, 50=neutral, 100=very positive)
    themes TEXT,                    -- comma-separated themes (AI-analyzed)
    urgency TEXT DEFAULT 'medium',  -- low, medium, high (AI-analyzed)
    analyzed_at TEXT                -- when AI analysis was performed
);

-- Index for common queries
CREATE INDEX idx_feedback_source ON feedback(source);
CREATE INDEX idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX idx_feedback_created ON feedback(created_at);

-- ============================================
-- MOCK DATA: Realistic product feedback
-- Mix of Cloudflare-specific and generic SaaS feedback
-- ============================================

-- Discord feedback
INSERT INTO feedback (source, author, content, created_at, sentiment, themes, urgency) VALUES
('discord', 'dev_sarah', 'Workers are amazing! Deployed my first API in under 5 minutes. The DX is incredible.', '2026-01-20 09:15:00', 'positive', 'onboarding,performance', 'low'),
('discord', 'cloudninja42', 'Getting CORS errors when calling my worker from localhost. The error message doesnt help much - just says "blocked by CORS". How do I fix this?', '2026-01-21 14:30:00', 'negative', 'documentation,bugs', 'high'),
('discord', 'startupfounder', 'Is there a way to see real-time logs for my worker? The dashboard logs seem delayed by a few minutes.', '2026-01-22 11:00:00', 'neutral', 'feature-request,ux', 'medium'),
('discord', 'backend_bob', 'D1 is exactly what I needed - finally a database that just works with Workers without any config headaches', '2026-01-23 16:45:00', 'positive', 'onboarding,performance', 'low'),
('discord', 'newbie_dev', 'Confused about the difference between KV and D1. When should I use which? Docs dont make this clear.', '2026-01-24 10:20:00', 'neutral', 'documentation', 'medium'),
('discord', 'frustrated_user', 'My worker keeps hitting CPU limits even though Im on the paid plan. Support hasnt responded in 3 days.', '2026-01-24 18:00:00', 'negative', 'pricing,performance,support', 'high');

-- GitHub Issues
INSERT INTO feedback (source, author, content, created_at, sentiment, themes, urgency) VALUES
('github', 'opensourcefan', 'Feature request: Add support for WebSocket connections in Workers. This would enable real-time applications.', '2026-01-19 08:00:00', 'neutral', 'feature-request', 'medium'),
('github', 'contributor123', 'Bug: wrangler dev crashes when using certain npm packages. Reproducible with sharp image library. Stack trace attached.', '2026-01-20 12:30:00', 'negative', 'bugs', 'high'),
('github', 'enterprise_eng', 'Would love to see better TypeScript support in wrangler. The types are often out of sync with the actual API.', '2026-01-21 09:45:00', 'neutral', 'feature-request,documentation', 'medium'),
('github', 'security_researcher', 'Documentation for secrets management could be improved. Current docs dont explain rotation or access patterns clearly.', '2026-01-22 15:00:00', 'neutral', 'documentation,security', 'medium'),
('github', 'performance_guy', 'Workers AI inference is slower than expected for Llama models. Getting 2-3 second response times. Is this normal?', '2026-01-23 11:30:00', 'negative', 'performance', 'high'),
('github', 'happy_maintainer', 'Just migrated from Lambda to Workers. Cold starts went from 800ms to basically zero. Huge win!', '2026-01-24 14:00:00', 'positive', 'performance', 'low');

-- Twitter/X Posts
INSERT INTO feedback (source, author, content, created_at, sentiment, themes, urgency) VALUES
('twitter', '@tech_blogger', 'Hot take: Cloudflare is building the best developer platform right now. Workers + D1 + R2 = chef kiss', '2026-01-20 12:00:00', 'positive', 'performance,pricing', 'low'),
('twitter', '@startup_cto', 'Trying to understand Cloudflare pricing for Workers. The calculator is confusing - anyone have a breakdown?', '2026-01-21 10:15:00', 'neutral', 'pricing,documentation', 'medium'),
('twitter', '@frustratedtim07', 'Cloudflare dashboard is so slow today. Takes 10+ seconds to load my worker list. Anyone else?', '2026-01-24 09:00:00', 'negative', 'performance,ux', 'high'),
('twitter', '@edge_dev_mike', '@cloudflare your workers are fire just deployed my first edge function', '2026-01-23 18:30:00', 'positive', 'onboarding,performance', 'low'),
('twitter', '@waiting_on_support', 'Been waiting 3 days for support to respond. Not great @cloudflare', '2026-01-24 11:15:00', 'negative', 'support', 'high'),
('twitter', '@lambda_refugee', 'Switched from AWS Lambda to Workers - 10x faster cold starts', '2026-01-24 16:45:00', 'positive', 'performance', 'low');

-- Support Tickets
INSERT INTO feedback (source, author, content, created_at, sentiment, themes, urgency) VALUES
('support', 'enterprise_client@bigcorp.com', 'We need SOC2 compliance documentation for Workers. Our security team is blocking adoption without it.', '2026-01-17 11:00:00', 'neutral', 'documentation,security', 'high'),
('support', 'small_biz@startup.io', 'Charged twice for the same billing period. Please refund the duplicate charge. Invoice #CF-2026-1234.', '2026-01-18 09:30:00', 'negative', 'billing,support', 'high'),
('support', 'dev@agency.com', 'How do we set up multiple environments (staging/prod) for Workers? Cant find clear guidance in docs.', '2026-01-19 14:00:00', 'neutral', 'documentation,onboarding', 'medium'),
('support', 'cto@fintech.co', 'Need to understand data residency options for D1. We have EU compliance requirements.', '2026-01-20 16:45:00', 'neutral', 'documentation,security', 'high'),
('support', 'happy_customer@email.com', 'Just want to say thanks - your support team resolved my issue in under an hour. Great service!', '2026-01-22 10:00:00', 'positive', 'support', 'low'),
('support', 'confused_user@gmail.com', 'I upgraded my plan but still seeing the old limits. Dashboard shows paid but workers are throttled.', '2026-01-24 08:30:00', 'negative', 'billing,bugs', 'high');

-- Email Feedback
INSERT INTO feedback (source, author, content, created_at, sentiment, themes, urgency) VALUES
('email', 'vp_engineering@tech.co', 'We are evaluating Workers for our API gateway. Can we get a technical deep-dive call with your solutions team?', '2026-01-16 10:00:00', 'positive', 'onboarding', 'medium'),
('email', 'developer@indie.dev', 'Love the product but the free tier limits are too restrictive for hobby projects. Consider more generous limits?', '2026-01-18 13:00:00', 'neutral', 'pricing', 'low'),
('email', 'architect@consulting.com', 'The wrangler CLI documentation is excellent. Best serverless DX Ive experienced. Keep it up!', '2026-01-19 15:30:00', 'positive', 'documentation,onboarding', 'low'),
('email', 'founder@saas.io', 'Feature request: native cron job support in Workers. Currently using external services for scheduled tasks.', '2026-01-21 11:00:00', 'neutral', 'feature-request', 'medium'),
('email', 'devrel@partner.com', 'Would love to see more video tutorials for Workers AI. Written docs are good but videos help adoption.', '2026-01-23 09:15:00', 'neutral', 'documentation', 'low'),
('email', 'migrating_user@aws.com', 'Coming from AWS - your pricing is so much simpler and cheaper. Just moved 3 services over this week.', '2026-01-24 12:00:00', 'positive', 'pricing,onboarding', 'low');

-- Community Forum Posts
INSERT INTO feedback (source, author, content, created_at, sentiment, themes, urgency) VALUES
('forum', 'community_helper', 'PSA: If youre getting "Script too large" errors, check that youre not bundling node_modules incorrectly. Wrangler should handle this.', '2026-01-17 14:00:00', 'neutral', 'documentation,bugs', 'medium'),
('forum', 'new_to_workers', 'Complete beginner here. Is there a tutorial that shows building a full app with Workers + D1 + frontend? The quickstarts only show hello world.', '2026-01-18 16:00:00', 'neutral', 'documentation,onboarding', 'medium'),
('forum', 'power_user', 'After 6 months with Workers, here are my top tips: 1) Use KV for caching, 2) D1 for structured data, 3) Dont fight the 50ms CPU limit - embrace it.', '2026-01-20 10:30:00', 'positive', 'documentation,performance', 'low'),
('forum', 'debugging_dan', 'The new tail logs feature is great but I wish I could filter by log level. Currently drowning in debug logs trying to find errors.', '2026-01-21 13:45:00', 'neutral', 'feature-request,ux', 'medium'),
('forum', 'edge_enthusiast', 'Workers + Durable Objects changed how I think about distributed systems. The programming model is elegant.', '2026-01-22 17:00:00', 'positive', 'feature-request,performance', 'low'),
('forum', 'cost_conscious', 'Can someone explain Workers pricing in simple terms? The docs mention requests, CPU time, and duration but Im still confused which matters most.', '2026-01-23 09:00:00', 'neutral', 'pricing,documentation', 'medium'),
('forum', 'integration_issues', 'Trying to connect Workers to my existing Postgres database. The docs mention Hyperdrive but setup is complicated. Any simpler options?', '2026-01-24 11:30:00', 'negative', 'documentation,onboarding', 'medium'),
('forum', 'satisfied_dev', 'Migrated our entire backend to Workers last month. Costs dropped 60% and latency improved globally. Best decision we made.', '2026-01-24 15:00:00', 'positive', 'pricing,performance', 'low');
