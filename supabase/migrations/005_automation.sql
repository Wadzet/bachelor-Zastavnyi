-- =============================================================================
-- 005_automation.sql
-- BizInsight — Automated Mode configuration + run audit log
-- =============================================================================
--
-- PURPOSE
-- -------
-- Adds the persistence layer for the admin-controlled "Automated Mode" feature.
--
--   • automation_settings — a SINGLE global configuration row that controls how
--     automated runs behave (which content type/topic/model/image provider to
--     use, how many sources to process, and which downstream actions are
--     allowed). All external-distribution switches default to FALSE.
--
--   • automation_runs — an append-style audit log. One row per manual
--     "Run automation now" execution, recording counts and outcome for
--     debugging and transparency.
--
-- SECURITY MODEL (identical to migrations 002 / 003)
-- --------------------------------------------------
--   • Both tables are written and read exclusively by server-side code using
--     the Supabase service role key (bypasses RLS).
--   • RLS is ENABLED with NO anon or authenticated policies — direct client
--     (browser) access is completely blocked.
--   • No secrets are stored in these tables. automation_runs.metadata holds
--     only safe summaries (counts, truncated error text) — never tokens.
--
-- SAFE-BY-DEFAULT
-- ---------------
--   • enabled                 = false  → automation does nothing until switched on
--   • create_post_after_draft = false  → draft-only; nothing is promoted
--   • auto_publish_website    = false  → posts stay unpublished
--   • auto_send_telegram      = false  → no Telegram distribution
--   • auto_send_linkedin      = false  → no LinkedIn distribution
--
-- IDEMPOTENCY
-- -----------
--   • CREATE TYPE / TABLE guarded so the migration is safe to re-run.
--   • The seed INSERT uses a guard so only one settings row is ever created.
--   • updated_at trigger reuses update_updated_at_column() from migration 001.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Enum: automation_run_status
-- ---------------------------------------------------------------------------
--   running   — run started, not yet finished
--   completed — every processed source succeeded
--   partial   — at least one source succeeded and at least one failed
--   failed    — the run aborted (config/auth error) or every source failed
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_run_status') THEN
    CREATE TYPE automation_run_status AS ENUM (
      'running',
      'completed',
      'failed',
      'partial'
    );
  END IF;
END$$;


-- ---------------------------------------------------------------------------
-- 2. automation_settings  (single global configuration row)
-- ---------------------------------------------------------------------------
-- Singleton enforced by the is_singleton column: it is always TRUE and carries
-- a UNIQUE constraint, so a second row can never be inserted. The application
-- always reads/updates the one existing row.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS automation_settings (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Master switch. When false, runAutomation() refuses to do anything.
  enabled                 BOOLEAN      NOT NULL DEFAULT false,

  -- Default generation settings applied to every automated draft.
  default_content_type    content_type NOT NULL DEFAULT 'insight',
  default_topic           TEXT         NOT NULL DEFAULT 'AI Strategy',
  default_text_model      TEXT,                 -- NULL → resolveModel() default
  default_image_provider  TEXT         NOT NULL DEFAULT 'auto',

  -- Workflow controls (all conservative by default).
  create_post_after_draft BOOLEAN      NOT NULL DEFAULT false,
  auto_publish_website    BOOLEAN      NOT NULL DEFAULT false,
  auto_send_telegram      BOOLEAN      NOT NULL DEFAULT false,
  auto_send_linkedin      BOOLEAN      NOT NULL DEFAULT false,

  -- How many active sources a single run may process.
  max_sources_per_run     INTEGER      NOT NULL DEFAULT 3,

  -- Singleton guard — see header note.
  is_singleton            BOOLEAN      NOT NULL DEFAULT true,

  created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT automation_settings_singleton_unique UNIQUE (is_singleton),

  CONSTRAINT automation_settings_singleton_true
    CHECK (is_singleton = true),

  CONSTRAINT automation_settings_topic_check CHECK (
    default_topic IN (
      'AI Strategy',
      'Operations',
      'Leadership',
      'Automation',
      'Case Study',
      'Market Trends'
    )
  ),

  CONSTRAINT automation_settings_image_provider_check CHECK (
    default_image_provider IN ('auto', 'replicate', 'gemini', 'svg')
  ),

  CONSTRAINT automation_settings_max_sources_check CHECK (
    max_sources_per_run BETWEEN 1 AND 20
  )
);

COMMENT ON TABLE automation_settings IS
  'Single global configuration row for Automated Mode. '
  'Admin-only via service role. All external-distribution switches default to false.';
COMMENT ON COLUMN automation_settings.default_text_model IS
  'Optional Gemini model override. NULL falls back to resolveModel() default.';
COMMENT ON COLUMN automation_settings.create_post_after_draft IS
  'false = create drafts only (review status). true = also promote to posts.';
COMMENT ON COLUMN automation_settings.is_singleton IS
  'Always true; UNIQUE constraint guarantees at most one settings row exists.';

CREATE TRIGGER trg_automation_settings_updated_at
  BEFORE UPDATE ON automation_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 3. automation_runs  (audit log)
-- ---------------------------------------------------------------------------
-- One row per "Run automation now" execution. Append-style: a run is created
-- with status 'running' and finalised to completed/partial/failed.
-- metadata holds a SAFE summary only (no tokens, no secrets).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS automation_runs (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  status            automation_run_status NOT NULL DEFAULT 'running',
  started_at        TIMESTAMPTZ           NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,          -- NULL until the run finishes
  processed_sources INTEGER               NOT NULL DEFAULT 0,
  created_drafts    INTEGER               NOT NULL DEFAULT 0,
  created_posts     INTEGER               NOT NULL DEFAULT 0,
  error_message     TEXT,                 -- safe, truncated; NULL on success
  metadata          JSONB,                -- safe per-source summary
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT now()
);

COMMENT ON TABLE automation_runs IS
  'Audit log of Automated Mode executions. Admin-only via service role. '
  'metadata stores safe summaries only — never tokens or secrets.';

CREATE INDEX IF NOT EXISTS idx_automation_runs_started_at
  ON automation_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status
  ON automation_runs (status);


-- ---------------------------------------------------------------------------
-- 4. Enable RLS — no anon policies (service role only)
-- ---------------------------------------------------------------------------

ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs     ENABLE ROW LEVEL SECURITY;

-- No policies for anon or authenticated roles.
-- The service role bypasses RLS and retains full access.


-- ---------------------------------------------------------------------------
-- 5. Seed the single settings row (safe defaults)
-- ---------------------------------------------------------------------------
-- Inserts exactly one row only if the table is currently empty.
-- Re-running the migration will not create a duplicate.
-- ---------------------------------------------------------------------------

INSERT INTO automation_settings (enabled)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM automation_settings);


-- =============================================================================
-- End of 005_automation.sql
-- =============================================================================
