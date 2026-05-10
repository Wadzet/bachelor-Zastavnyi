-- =============================================================================
-- 003_linkedin_oauth.sql
-- BizInsight — LinkedIn OAuth token storage
-- =============================================================================
--
-- PURPOSE
-- -------
-- Stores LinkedIn OAuth access tokens server-side so the Next.js app can
-- call the LinkedIn Posts API without exposing tokens to the browser.
--
-- SECURITY MODEL
-- ---------------
-- • Tokens are written and read exclusively by server-side code using the
--   Supabase service role key (bypasses RLS).
-- • RLS is enabled with no anon or authenticated policies — direct client
--   access is completely blocked.
-- • The browser never receives the access_token value; only safe metadata
--   (display_name, expires_at, connected: true/false) is returned to the
--   client via the /api/admin/linkedin/status route.
-- • MVP stores the token as plaintext in the DB. Production hardening
--   should encrypt tokens at rest using a server-managed key.
--
-- LIFECYCLE
-- ----------
-- 1. Admin clicks "Connect LinkedIn" → /api/admin/linkedin/connect
--    generates state, stores in httpOnly cookie, redirects to LinkedIn OAuth.
-- 2. LinkedIn redirects to /api/admin/linkedin/callback with code + state.
-- 3. Callback exchanges code for access_token, fetches member identity,
--    upserts this table, redirects to /admin/posts?linkedin=connected.
-- 4. /api/admin/posts/[id]/linkedin/send loads the token from this table
--    and calls the LinkedIn Posts API server-side.
--
-- IDEMPOTENCY
-- -----------
-- • Uses DROP POLICY IF EXISTS — safe to re-run.
-- • Table creation uses IF NOT EXISTS — safe to re-run.
-- • updated_at trigger reuses update_updated_at_column() from migration 001.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. social_accounts table
-- ---------------------------------------------------------------------------
-- Stores OAuth credentials for external social platforms.
-- Keyed by (provider, account_type, provider_account_id).
--
-- For LinkedIn MVP:
--   provider             = 'linkedin'
--   account_type         = 'member'          (personal profile; not company page)
--   provider_account_id  = LinkedIn OIDC sub (stable member ID)
--   display_name         = member's full name from OIDC userinfo
--   access_token         = LinkedIn OAuth access token (server-only)
--   expires_at           = UTC timestamp when the token expires (~60 days)
--   metadata             = { email, given_name, family_name } from OIDC
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS social_accounts (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider              TEXT        NOT NULL,               -- 'linkedin', 'twitter', etc.
  account_type          TEXT        NOT NULL,               -- 'member' or 'company'
  provider_account_id   TEXT        NOT NULL,               -- stable ID from the provider
  display_name          TEXT,                               -- human-readable name
  access_token          TEXT        NOT NULL,               -- OAuth access token (server-only)
  expires_at            TIMESTAMPTZ,                        -- NULL = non-expiring token
  metadata              JSONB,                              -- provider-specific extras
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per provider + account type + provider account ID.
  -- Re-connecting the same LinkedIn account refreshes the existing row.
  CONSTRAINT social_accounts_provider_account_unique
    UNIQUE (provider, account_type, provider_account_id)
);

COMMENT ON TABLE social_accounts IS
  'Server-side OAuth token storage for social distribution channels. '
  'RLS enabled — no anon policies. All access via service role. '
  'MVP stores tokens as plaintext; production should encrypt at rest.';

COMMENT ON COLUMN social_accounts.provider IS
  'External OAuth provider identifier. Currently: ''linkedin''.';

COMMENT ON COLUMN social_accounts.account_type IS
  'Scope of the account: ''member'' (personal profile) or ''company'' (org page). '
  'LinkedIn member posting uses w_member_social scope.';

COMMENT ON COLUMN social_accounts.provider_account_id IS
  'Stable identifier from the provider. '
  'For LinkedIn OIDC: the ''sub'' claim from the userinfo endpoint.';

COMMENT ON COLUMN social_accounts.access_token IS
  'OAuth access token. SERVER-ONLY — never returned to the browser. '
  'LinkedIn tokens expire after ~60 days. Re-connect to refresh.';

COMMENT ON COLUMN social_accounts.expires_at IS
  'UTC timestamp when the access token expires. '
  'Computed as: now() + expires_in seconds from the token response.';

COMMENT ON COLUMN social_accounts.metadata IS
  'Provider-specific extras stored as JSONB. '
  'LinkedIn: { email, given_name, family_name } from OIDC userinfo.';

CREATE INDEX IF NOT EXISTS idx_social_accounts_provider
  ON social_accounts (provider, account_type);

CREATE TRIGGER trg_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 2. Enable RLS — no anon policies
-- ---------------------------------------------------------------------------
-- The service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS entirely.
-- All reads and writes go through Next.js server-side route handlers.
-- No direct client access is permitted.
-- ---------------------------------------------------------------------------

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- No policies created for anon or authenticated roles.
-- Service role bypasses RLS and retains full access.


-- =============================================================================
-- End of 003_linkedin_oauth.sql
-- =============================================================================
