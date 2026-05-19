-- =============================================================================
-- 004_post_images_bucket.sql
-- BizInsight — RLS policy for AI-generated post cover images
-- =============================================================================
--
-- PURPOSE
-- -------
-- Adds a public-read RLS policy on storage.objects so that AI-generated cover
-- images stored in the "post-images" bucket are accessible via public CDN URLs.
--
-- MANUAL BUCKET SETUP (one-time, required before deploying this feature)
-- -----------------------------------------------------------------------
-- The "post-images" bucket CANNOT be created via SQL migration because
-- storage.buckets is Supabase-managed and requires table ownership privileges
-- that are not available to the migration runner.
--
-- Create the bucket manually in the Supabase Dashboard:
--   1. Go to Storage in the left sidebar.
--   2. Click "New bucket".
--   3. Name: post-images
--   4. Public bucket: ON  (required for public cover image URLs)
--   5. File size limit: 5 MB (optional, recommended)
--   6. Allowed MIME types: image/png, image/jpeg, image/webp (optional)
--   7. Click "Save".
--
-- PATH CONVENTION
-- ----------------
-- posts/{postId}/cover-{timestamp}.png
-- Example: posts/9f1a2b3c-…/cover-1716400000000.png
--
-- SECURITY MODEL
-- ---------------
-- • Uploads happen server-side only via SUPABASE_SERVICE_ROLE_KEY.
-- • The bucket is public — any authenticated or anonymous user can READ images
--   by URL (required for public-facing cover images on the website).
-- • Only the service role can INSERT/UPDATE/DELETE objects (bypasses RLS).
-- • No direct browser uploads are permitted.
-- • The storage RLS policy below enforces read-only anon access.
--
-- IDEMPOTENCY
-- -----------
-- DROP POLICY IF EXISTS before CREATE POLICY — safe to re-run.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- RLS policy on storage.objects for the post-images bucket
-- ---------------------------------------------------------------------------
-- Allow anyone to read (SELECT) objects in post-images.
-- This is required for public cover images to load on the website.
--
-- The service role bypasses RLS entirely for writes — no INSERT/UPDATE/DELETE
-- policy is needed here.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "post_images_public_read" ON storage.objects;
CREATE POLICY "post_images_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'post-images');

COMMENT ON POLICY "post_images_public_read" ON storage.objects IS
  'Allow anonymous and authenticated users to read objects in the post-images bucket. '
  'Required for AI-generated cover images to be publicly visible on the website. '
  'Uploads and deletes go through the service role (bypasses RLS). '
  'The post-images bucket must be created manually in the Supabase Dashboard.';


-- =============================================================================
-- Verification query (run manually to confirm):
-- =============================================================================
--   SELECT id, name, public FROM storage.buckets WHERE id = 'post-images';
--
--   SELECT policyname, cmd, roles
--   FROM pg_policies
--   WHERE tablename = 'objects' AND policyname LIKE 'post_images%';
-- =============================================================================
-- End of 004_post_images_bucket.sql
-- =============================================================================
