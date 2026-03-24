-- =============================================================================
-- 001_initial_schema.sql
-- BizInsight — Initial Supabase / PostgreSQL schema
-- =============================================================================
--
-- RLS is NOT enabled in this migration.
--
-- Future RLS strategy (to be applied when authentication is added):
--   • posts    — anon role: SELECT WHERE status = 'published'
--   • authors  — anon role: SELECT (all rows, no filter)
--   • sources, drafts, ai_generations, distribution_jobs, inquiries
--              — no anon policies; read/write via service role key only
--
-- Until RLS is active, all server-side access uses the Supabase service role
-- key. No client-side Supabase calls are made in this phase.
--
-- Table creation order (dependency chain):
--   1. authors          — no foreign key dependencies
--   2. sources          — no foreign key dependencies
--   3. drafts           — depends on sources
--   4. ai_generations   — depends on drafts
--   5. posts            — depends on authors, drafts
--   6. distribution_jobs— depends on posts
--   7. inquiries        — no foreign key dependencies
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
-- gen_random_uuid() is built-in from PostgreSQL 13+ (standard on Supabase).
-- pgcrypto is included as a safety net and is enabled by Supabase by default.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

CREATE TYPE content_type AS ENUM (
  'insight',
  'interview',
  'article',
  'news'
);

CREATE TYPE post_status AS ENUM (
  'draft',
  'review',
  'published',
  'archived'
);

CREATE TYPE draft_status AS ENUM (
  'pending',
  'generating',
  'review',
  'approved',
  'rejected'
);

CREATE TYPE source_type AS ENUM (
  'newsletter',
  'blog',
  'podcast',
  'social',
  'news',
  'research'
);

CREATE TYPE source_status AS ENUM (
  'active',
  'paused',
  'error'
);

-- Telegram now; LinkedIn planned. website publication = posts.status = 'published'.
CREATE TYPE channel AS ENUM (
  'telegram',
  'linkedin'
);

CREATE TYPE channel_status AS ENUM (
  'pending',
  'ready',
  'scheduled',
  'sent',
  'failed'
);

CREATE TYPE generation_status AS ENUM (
  'pending',
  'completed',
  'failed'
);

CREATE TYPE inquiry_status AS ENUM (
  'new',
  'read',
  'archived'
);


-- ---------------------------------------------------------------------------
-- 2. Reusable updated_at trigger function
-- Applied to: authors, sources, drafts, posts, distribution_jobs
-- Not applied to: ai_generations (append-only; completed_at is terminal state)
--                 inquiries (append-only; status is the only mutable field)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- 3. authors
-- ---------------------------------------------------------------------------
-- Named editorial contributors. Used on insights and interviews (the
-- journalist/editor who wrote or conducted the piece, not the interview guest).
-- Seeded manually via Supabase dashboard for MVP; no admin UI in this phase.
-- ---------------------------------------------------------------------------

CREATE TABLE authors (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL, -- e.g. "Senior Editor", "Contributing Analyst"
  avatar_url  TEXT,                 -- NULL until image storage is implemented
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE authors IS
  'Editorial contributors who write insights or conduct interviews. '
  'The author is the BizInsight staff member, not the interview guest.';
COMMENT ON COLUMN authors.role IS
  'Display role shown on public pages, e.g. "Senior Editor".';
COMMENT ON COLUMN authors.avatar_url IS
  'External URL or future Supabase Storage path. NULL until images are added.';

CREATE TRIGGER trg_authors_updated_at
  BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 4. sources
-- ---------------------------------------------------------------------------
-- Trusted publications the future AI agent monitors for editorial signals.
-- Managed from /admin/sources. Admin-only; no public read access.
-- ---------------------------------------------------------------------------

CREATE TABLE sources (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT          NOT NULL,
  url             TEXT          NOT NULL,
  type            source_type   NOT NULL,
  status          source_status NOT NULL DEFAULT 'active',
  description     TEXT,
  last_checked_at TIMESTAMPTZ,  -- NULL = source has never been checked
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT sources_url_unique UNIQUE (url)
);

COMMENT ON TABLE sources IS
  'Trusted publications monitored by the AI agent. Admin-only.';
COMMENT ON COLUMN sources.url IS
  'Base domain or RSS/feed URL. Unique per source.';
COMMENT ON COLUMN sources.last_checked_at IS
  'Timestamp of most recent check by the AI agent. NULL = never checked.';

CREATE INDEX idx_sources_status ON sources (status);
-- url uniqueness index is created automatically by the UNIQUE constraint above.

CREATE TRIGGER trg_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 5. drafts
-- ---------------------------------------------------------------------------
-- AI-assisted editorial drafts awaiting human review.
-- Intermediate step between a source signal and a published post.
-- Rejected drafts are never deleted — they remain as an audit trail.
--
-- ON DELETE SET NULL for source_id:
--   Deleting a source does not delete its associated drafts.
--   The draft's source_url preserves the specific article reference.
-- ---------------------------------------------------------------------------

CREATE TABLE drafts (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT         NOT NULL,
  excerpt       TEXT         NOT NULL DEFAULT '',
  body_markdown TEXT         NOT NULL DEFAULT '',
  content_type  content_type NOT NULL DEFAULT 'insight',
  topic         TEXT         NOT NULL,
  status        draft_status NOT NULL DEFAULT 'pending',
  source_id     UUID,        -- FK → sources.id (SET NULL on source deletion)
  source_url    TEXT,        -- specific article URL; may differ from sources.url
  raw_input     TEXT,        -- user-pasted raw text (alternative to source_url)
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT drafts_topic_check CHECK (
    topic IN (
      'AI Strategy',
      'Operations',
      'Leadership',
      'Automation',
      'Case Study',
      'Market Trends'
    )
  ),

  CONSTRAINT drafts_source_id_fk
    FOREIGN KEY (source_id)
    REFERENCES sources (id)
    ON DELETE SET NULL
);

COMMENT ON TABLE drafts IS
  'AI-generated editorial drafts pending human review. '
  'Approved drafts are promoted to posts (fields copied, draft_id FK preserved).';
COMMENT ON COLUMN drafts.body_markdown IS
  'Empty string until generated or manually authored.';
COMMENT ON COLUMN drafts.source_url IS
  'Specific article URL that triggered generation. May differ from sources.url.';
COMMENT ON COLUMN drafts.raw_input IS
  'User-pasted raw text used for generation. Alternative to source_url.';

CREATE INDEX idx_drafts_status     ON drafts (status);
CREATE INDEX idx_drafts_source_id  ON drafts (source_id);
CREATE INDEX idx_drafts_created_at ON drafts (created_at DESC);

CREATE TRIGGER trg_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 6. ai_generations
-- ---------------------------------------------------------------------------
-- Audit log of every AI generation attempt.
-- One draft can have many generation rows (initial attempt + regenerations).
-- draft_id is nullable: the generation row is created before the draft exists.
-- Rows are append-only; completed_at records the terminal state.
-- No updated_at trigger applied to this table.
--
-- ON DELETE SET NULL for draft_id:
--   If a draft is deleted, generation logs are preserved for cost/audit purposes.
-- ---------------------------------------------------------------------------

CREATE TABLE ai_generations (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id          UUID,             -- FK → drafts.id (SET NULL on draft deletion)
  source_url        TEXT,             -- article URL that triggered this generation
  raw_input         TEXT,             -- pasted text, if user-provided
  model             TEXT              NOT NULL, -- e.g. "gpt-4o"
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  status            generation_status NOT NULL DEFAULT 'pending',
  error_message     TEXT,             -- populated on failure; NULL on success
  generated_title   TEXT,             -- raw model output before human editing
  generated_excerpt TEXT,
  generated_body    TEXT,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,      -- NULL until generation finishes or fails

  CONSTRAINT ai_generations_draft_id_fk
    FOREIGN KEY (draft_id)
    REFERENCES drafts (id)
    ON DELETE SET NULL
);

COMMENT ON TABLE ai_generations IS
  'Append-only log of AI generation attempts. '
  'One draft may have many rows (initial + regenerations). '
  'Preserved even if the associated draft is deleted.';
COMMENT ON COLUMN ai_generations.draft_id IS
  'NULL when generation has not yet produced or been linked to a draft.';
COMMENT ON COLUMN ai_generations.generated_title IS
  'Raw model output before any human editing. Kept for comparison and audit.';

CREATE INDEX idx_ai_generations_draft_id   ON ai_generations (draft_id);
CREATE INDEX idx_ai_generations_status     ON ai_generations (status);
CREATE INDEX idx_ai_generations_created_at ON ai_generations (created_at DESC);


-- ---------------------------------------------------------------------------
-- 7. posts
-- ---------------------------------------------------------------------------
-- All publishable content for the public website.
-- content_type discriminates between insights, interviews, articles, news.
--
-- App-layer validation (enforced in server actions; not expressible in SQL):
--   • content_type = 'interview'
--       → guest_data must be non-null: { name, role, company, avatar_url?, bio? }
--       → qa_data must be non-null:    [{ question, answer }, ...]
--   • content_type IN ('insight', 'article', 'news')
--       → body_markdown must be non-null and non-empty
--
-- RLS (not yet active — service role key used for all access):
--   Future anon policy: SELECT WHERE status = 'published'
--   Future admin access: service role key (bypasses RLS)
--
-- ON DELETE SET NULL for author_id:
--   Deleting an author orphans the post but does not remove it.
--   Posts can be re-attributed later.
--
-- ON DELETE SET NULL for draft_id:
--   The draft_id column is an audit trail only. Fields are copied on promotion.
--   Deleting the source draft does not affect the post.
-- ---------------------------------------------------------------------------

CREATE TABLE posts (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT         NOT NULL,
  excerpt         TEXT         NOT NULL,
  body_markdown   TEXT,        -- required for insight/article/news (app-layer)
  content_type    content_type NOT NULL DEFAULT 'insight',
  topic           TEXT         NOT NULL,
  status          post_status  NOT NULL DEFAULT 'draft',
  slug            TEXT         NOT NULL,
  author_id       UUID,        -- FK → authors.id (SET NULL on author deletion)
  guest_data      JSONB,       -- required for interview (app-layer)
  qa_data         JSONB,       -- required for interview (app-layer)
  cover_image_url TEXT,        -- external URL for MVP; Supabase Storage later
  featured        BOOLEAN      NOT NULL DEFAULT false,
  draft_id        UUID,        -- FK → drafts.id (audit trail only; SET NULL)
  published_at    TIMESTAMPTZ, -- set when status transitions to 'published'
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT posts_slug_unique UNIQUE (slug),

  CONSTRAINT posts_topic_check CHECK (
    topic IN (
      'AI Strategy',
      'Operations',
      'Leadership',
      'Automation',
      'Case Study',
      'Market Trends'
    )
  ),

  CONSTRAINT posts_author_id_fk
    FOREIGN KEY (author_id)
    REFERENCES authors (id)
    ON DELETE SET NULL,

  CONSTRAINT posts_draft_id_fk
    FOREIGN KEY (draft_id)
    REFERENCES drafts (id)
    ON DELETE SET NULL
);

COMMENT ON TABLE posts IS
  'All publishable content for the public website. '
  'content_type = ''interview'' uses guest_data + qa_data (JSONB). '
  'All other types use body_markdown. App layer enforces these rules.';
COMMENT ON COLUMN posts.body_markdown IS
  'Markdown prose. Required for insight/article/news. '
  'NULL for interviews (content in qa_data). Enforced at app layer.';
COMMENT ON COLUMN posts.guest_data IS
  'Interview guest profile JSON: { name, role, company, avatar_url?, bio? }. '
  'Required when content_type = ''interview''. Enforced at app layer.';
COMMENT ON COLUMN posts.qa_data IS
  'Interview Q&A array JSON: [{ question, answer }]. '
  'Required when content_type = ''interview''. Enforced at app layer.';
COMMENT ON COLUMN posts.featured IS
  'When true, this post appears in homepage featured sections.';
COMMENT ON COLUMN posts.slug IS
  'URL-safe unique identifier. Used in /insights/[slug] and /interviews/[slug].';
COMMENT ON COLUMN posts.draft_id IS
  'References the draft this post was promoted from. '
  'Fields are copied on promotion; this is an audit trail reference only.';
COMMENT ON COLUMN posts.published_at IS
  'Set by the server action that transitions status to ''published''.';

-- slug uniqueness index is created automatically by the UNIQUE constraint.
CREATE INDEX idx_posts_type_status  ON posts (content_type, status);
CREATE INDEX idx_posts_featured_pub ON posts (featured, published_at DESC);
CREATE INDEX idx_posts_published_at ON posts (published_at DESC);

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 8. distribution_jobs
-- ---------------------------------------------------------------------------
-- One row per channel per post. Tracks external distribution state.
-- Website publication = posts.status = 'published'. Not represented here.
-- Retry resets status + clears error_message; does not create a new row.
--
-- ON DELETE CASCADE for post_id:
--   If a post is deleted, its distribution jobs are deleted with it.
--   A distribution record has no value without the post it refers to.
-- ---------------------------------------------------------------------------

CREATE TABLE distribution_jobs (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID           NOT NULL,
  channel       channel        NOT NULL,
  status        channel_status NOT NULL DEFAULT 'pending',
  scheduled_at  TIMESTAMPTZ,  -- for future scheduling support
  sent_at       TIMESTAMPTZ,  -- populated when status transitions to 'sent'
  error_message TEXT,         -- last API error; cleared on retry
  metadata      JSONB,        -- channel-specific: { telegram_message_id }, etc.
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT distribution_jobs_post_channel_unique UNIQUE (post_id, channel),

  CONSTRAINT distribution_jobs_post_id_fk
    FOREIGN KEY (post_id)
    REFERENCES posts (id)
    ON DELETE CASCADE
);

COMMENT ON TABLE distribution_jobs IS
  'One row per channel per post. Tracks Telegram and LinkedIn distribution. '
  'Website publication is represented by posts.status = ''published'' only.';
COMMENT ON COLUMN distribution_jobs.metadata IS
  'Channel-specific payload stored after a successful send. '
  'Examples: { "telegram_message_id": 123 }, { "linkedin_post_id": "abc" }.';
COMMENT ON COLUMN distribution_jobs.error_message IS
  'Last error returned by the channel API. Cleared when a retry is initiated.';

-- post_channel unique index is created by the UNIQUE constraint above.
CREATE INDEX idx_distribution_jobs_post_id        ON distribution_jobs (post_id);
CREATE INDEX idx_distribution_jobs_channel_status ON distribution_jobs (channel, status);

CREATE TRIGGER trg_distribution_jobs_updated_at
  BEFORE UPDATE ON distribution_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 9. inquiries
-- ---------------------------------------------------------------------------
-- Consultation form submissions from /contact.
-- Written via a server action (safe for anon access pattern).
-- Read by admin only via service role key.
-- No updated_at column: status is the only mutable field and the change
-- timestamp is not required for MVP.
-- ---------------------------------------------------------------------------

CREATE TABLE inquiries (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  TEXT           NOT NULL,
  email      TEXT           NOT NULL, -- work email from the consultation form
  company    TEXT           NOT NULL,
  role       TEXT           NOT NULL, -- job title submitted by the contact
  message    TEXT           NOT NULL,
  status     inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE inquiries IS
  'Consultation form submissions from /contact. '
  'Written via server action; read by admin only (service role key).';
COMMENT ON COLUMN inquiries.email IS
  'Work email submitted on the consultation form.';
COMMENT ON COLUMN inquiries.role IS
  'Job title / seniority submitted by the contact.';

CREATE INDEX idx_inquiries_status     ON inquiries (status);
CREATE INDEX idx_inquiries_created_at ON inquiries (created_at DESC);


-- =============================================================================
-- End of 001_initial_schema.sql
-- =============================================================================
