-- =============================================================================
-- 002_enable_rls.sql
-- BizInsight — Enable Row Level Security on all public tables
-- =============================================================================
--
-- PURPOSE
-- -------
-- Protect Supabase tables from direct unauthenticated Data API access while
-- preserving the existing Next.js application behavior unchanged.
--
-- HOW THE APP CONTINUES TO WORK
-- -------------------------------
-- • All Next.js server-side code (public pages, admin pages, admin API routes,
--   contact form) uses the Supabase service role key (SUPABASE_SERVICE_ROLE_KEY).
-- • The service role BYPASSES RLS entirely — no policy needs to exist for
--   server-side operations to succeed.
-- • The browser never queries Supabase directly. The auth browser client
--   (NEXT_PUBLIC_SUPABASE_ANON_KEY) is used only for signInWithPassword() and
--   signOut() — never for data queries.
-- • Therefore, enabling RLS with no anon write policies does not break anything.
--
-- WHAT THIS MIGRATION ADDS
-- -------------------------
-- • RLS enabled on all 7 tables.
-- • Anon/authenticated SELECT on authors (all rows — public editorial data).
-- • Anon/authenticated SELECT on posts WHERE status = 'published' only.
-- • No anon access to: sources, drafts, ai_generations, distribution_jobs,
--   inquiries — these are admin-only and accessed exclusively via service role.
-- • No anon INSERT on inquiries — the /api/contact route writes via service role.
--
-- FUTURE IMPROVEMENT
-- -------------------
-- When direct admin dashboard access or Supabase client-side admin queries are
-- needed, add role-based policies using Supabase Auth JWT claims (e.g. a custom
-- `app_role = 'admin'` claim). That is outside the scope of this migration.
--
-- SAFETY
-- -------
-- • Uses DROP POLICY IF EXISTS before each CREATE POLICY — fully idempotent.
-- • No destructive changes, no seed data, no environment variables.
-- • Does not affect existing schema objects (tables, indexes, triggers, enums).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. authors — enable RLS + public read
-- ---------------------------------------------------------------------------
-- Authors are public editorial identities (name, role, avatar).
-- All rows are safe to expose to anonymous visitors.
-- Service role bypasses RLS for admin management.
-- ---------------------------------------------------------------------------

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authors_public_read" ON authors;
CREATE POLICY "authors_public_read"
  ON authors
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON POLICY "authors_public_read" ON authors IS
  'Allow anonymous and authenticated users to read all author rows. '
  'Author data is public editorial information (name, role, avatar). '
  'Writes are admin-only via service role (bypasses RLS).';


-- ---------------------------------------------------------------------------
-- 2. sources — enable RLS, no anon access
-- ---------------------------------------------------------------------------
-- Trusted publication list. Admin-only data.
-- All reads and writes go through Next.js admin API routes using service role.
-- No direct anon access is needed or safe.
-- ---------------------------------------------------------------------------

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- No policies created for anon or authenticated roles.
-- Service role bypasses RLS and retains full access.

COMMENT ON TABLE sources IS
  'Trusted publications monitored by the AI agent. Admin-only. '
  'RLS enabled — no anon policies. All access via service role through '
  'Next.js admin API routes (/api/admin/sources/*).';


-- ---------------------------------------------------------------------------
-- 3. drafts — enable RLS, no anon access
-- ---------------------------------------------------------------------------
-- AI-assisted editorial drafts. Admin-only data.
-- Read and written exclusively via /api/admin/drafts/* server routes.
-- ---------------------------------------------------------------------------

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- No policies created for anon or authenticated roles.

COMMENT ON TABLE drafts IS
  'AI-generated editorial drafts pending human review. Admin-only. '
  'RLS enabled — no anon policies. All access via service role through '
  'Next.js admin API routes (/api/admin/drafts/*).';


-- ---------------------------------------------------------------------------
-- 4. ai_generations — enable RLS, no anon access
-- ---------------------------------------------------------------------------
-- Audit log of AI generation attempts. Contains model names, token counts,
-- raw AI outputs. Sensitive operational data — admin-only.
-- ---------------------------------------------------------------------------

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- No policies created for anon or authenticated roles.

COMMENT ON TABLE ai_generations IS
  'Append-only log of AI generation attempts. Admin-only. '
  'RLS enabled — no anon policies. All access via service role through '
  'Next.js admin API routes (/api/admin/drafts/generate).';


-- ---------------------------------------------------------------------------
-- 5. posts — enable RLS + published-only public read
-- ---------------------------------------------------------------------------
-- The core content table. Anon users may only see published posts.
-- Draft, review, and archived posts are invisible to direct Data API access.
-- Service role bypasses RLS for all admin operations (CRUD, status changes).
-- ---------------------------------------------------------------------------

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_published_read" ON posts;
CREATE POLICY "posts_published_read"
  ON posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

COMMENT ON POLICY "posts_published_read" ON posts IS
  'Allow anonymous and authenticated users to SELECT only published posts. '
  'Draft, review, and archived posts are not visible to direct Data API access. '
  'Admin writes and reads of all status rows go through service role (bypasses RLS). '
  'The Next.js public DAL (src/lib/data/posts.ts) uses service role and always '
  'filters by status = ''published'' at the query level as well — defense-in-depth.';


-- ---------------------------------------------------------------------------
-- 6. distribution_jobs — enable RLS, no anon access
-- ---------------------------------------------------------------------------
-- Telegram / LinkedIn distribution state. Operational admin data.
-- Managed exclusively via /api/admin/posts/[id]/telegram/* server routes.
-- ---------------------------------------------------------------------------

ALTER TABLE distribution_jobs ENABLE ROW LEVEL SECURITY;

-- No policies created for anon or authenticated roles.

COMMENT ON TABLE distribution_jobs IS
  'Per-channel per-post distribution state. Admin-only. '
  'RLS enabled — no anon policies. All access via service role through '
  'Next.js admin API routes (/api/admin/posts/[id]/telegram/*).';


-- ---------------------------------------------------------------------------
-- 7. inquiries — enable RLS, no anon access
-- ---------------------------------------------------------------------------
-- Consultation form submissions. Contains PII (name, email, company, message).
-- Inserted via POST /api/contact using the service role key.
-- No anon INSERT policy — direct client writes are not permitted.
-- Read by admin via service role only.
-- ---------------------------------------------------------------------------

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- No INSERT policy for anon — /api/contact writes via service role.
-- No SELECT policy for anon — admin reads via service role.

COMMENT ON TABLE inquiries IS
  'Consultation form submissions from /contact. '
  'RLS enabled — no anon policies. '
  'INSERT: POST /api/contact route uses service role (bypasses RLS). '
  'SELECT: admin pages use service role (bypasses RLS). '
  'No direct client write access is permitted — PII must stay server-side.';


-- =============================================================================
-- Summary of access after this migration
-- =============================================================================
--
-- TABLE              | anon SELECT | anon INSERT | service role
-- -------------------|-------------|-------------|--------------------
-- authors            | ALL rows    | denied      | full access (bypasses RLS)
-- posts              | published   | denied      | full access (bypasses RLS)
-- sources            | denied      | denied      | full access (bypasses RLS)
-- drafts             | denied      | denied      | full access (bypasses RLS)
-- ai_generations     | denied      | denied      | full access (bypasses RLS)
-- distribution_jobs  | denied      | denied      | full access (bypasses RLS)
-- inquiries          | denied      | denied      | full access (bypasses RLS)
--
-- =============================================================================
-- End of 002_enable_rls.sql
-- =============================================================================
