-- =============================================================================
-- 006_automation_scheduling.sql
-- BizInsight — Scheduled source checking + automation trigger tracking
-- =============================================================================
--
-- PURPOSE
-- -------
-- Extends the Automated Mode feature (migration 005) with a configurable
-- scheduler so trusted sources can be checked automatically on a cadence.
--
--   • automation_settings  — adds scheduling configuration (enable flag,
--     interval, last/next run timestamps, timezone). Timing rules live in the
--     database so an admin can change cadence without redeploying. A static
--     Vercel Cron simply calls GET /api/cron/automation often; the application
--     decides whether a run is actually due.
--
--   • automation_runs       — adds a `trigger` column to distinguish manual
--     ("Run automation now") runs from scheduled (cron) runs.
--
--   • sources               — adds per-source automation controls so an admin
--     can exclude a source or give it a custom cadence. Reuses the existing
--     last_checked_at column for due calculations.
--
-- SECURITY MODEL (unchanged from 005)
-- -----------------------------------
--   • All reads/writes go through the Supabase service role (bypasses RLS).
--   • RLS stays ENABLED with NO anon/authenticated policies.
--   • No secrets are stored. The cron endpoint is protected by CRON_SECRET
--     (an env var) — never by anything in these tables.
--
-- SAFE-BY-DEFAULT
-- ---------------
--   • scheduled_checks_enabled = false → scheduler does nothing until enabled
--   • auto_publish_website / auto_send_telegram / auto_send_linkedin stay false
--     (set in migration 005; not changed here)
--
-- IDEMPOTENCY
-- -----------
--   • Every ADD COLUMN uses IF NOT EXISTS, so the migration is safe to re-run.
--   • CHECK constraints are added guarded (skipped if already present).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. automation_settings — scheduling configuration
-- ---------------------------------------------------------------------------

ALTER TABLE automation_settings
  ADD COLUMN IF NOT EXISTS scheduled_checks_enabled BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_interval_minutes   INTEGER     NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS last_scheduled_run_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_scheduled_run_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduler_timezone       TEXT        NOT NULL DEFAULT 'UTC';

-- Interval bounds: 15 minutes .. 24 hours. Guarded so re-running is safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'automation_settings_check_interval_check'
  ) THEN
    ALTER TABLE automation_settings
      ADD CONSTRAINT automation_settings_check_interval_check
      CHECK (check_interval_minutes BETWEEN 15 AND 1440);
  END IF;
END$$;

COMMENT ON COLUMN automation_settings.scheduled_checks_enabled IS
  'Master switch for cron-triggered automation. false = scheduler is idle.';
COMMENT ON COLUMN automation_settings.check_interval_minutes IS
  'Global cadence (minutes, 15..1440) between scheduled automation runs.';
COMMENT ON COLUMN automation_settings.last_scheduled_run_at IS
  'System-managed. Timestamp of the most recent scheduled (cron) run.';
COMMENT ON COLUMN automation_settings.next_scheduled_run_at IS
  'System-managed. Earliest time the next scheduled run may execute.';


-- ---------------------------------------------------------------------------
-- 2. automation_runs — trigger source (manual vs scheduled)
-- ---------------------------------------------------------------------------

ALTER TABLE automation_runs
  ADD COLUMN IF NOT EXISTS trigger TEXT NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'automation_runs_trigger_check'
  ) THEN
    ALTER TABLE automation_runs
      ADD CONSTRAINT automation_runs_trigger_check
      CHECK (trigger IN ('manual', 'scheduled'));
  END IF;
END$$;

COMMENT ON COLUMN automation_runs.trigger IS
  'How the run was started: manual ("Run automation now") or scheduled (cron).';


-- ---------------------------------------------------------------------------
-- 3. sources — per-source automation controls
-- ---------------------------------------------------------------------------
-- last_checked_at already exists (migration 001) and is reused for due checks.
-- ---------------------------------------------------------------------------

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS automation_enabled     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS check_interval_minutes INTEGER;

-- Optional per-source override; NULL → use the global interval. Bounds match.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sources_check_interval_check'
  ) THEN
    ALTER TABLE sources
      ADD CONSTRAINT sources_check_interval_check
      CHECK (check_interval_minutes IS NULL OR check_interval_minutes BETWEEN 15 AND 1440);
  END IF;
END$$;

COMMENT ON COLUMN sources.automation_enabled IS
  'When false, Automated Mode skips this source during scheduled runs.';
COMMENT ON COLUMN sources.check_interval_minutes IS
  'Optional per-source cadence override (minutes, 15..1440). NULL = use global.';


-- =============================================================================
-- End of 006_automation_scheduling.sql
-- =============================================================================
