-- WI-1: Persist RLS state in version control.
--
-- The application connects to Postgres exclusively through Prisma's
-- DATABASE_URL (a table-owning role), never through PostgREST/supabase-js,
-- for any of these tables. Table owners bypass RLS, so "RLS enabled with
-- zero policies" is a deliberate deny-all posture for the PostgREST/anon and
-- authenticated roles, not an oversight. See docs/domains/auth.md for the
-- rationale. ENABLE ROW LEVEL SECURITY is idempotent/no-op when already
-- enabled, so this is safe to run even though most of these tables already
-- have it enabled on the live database.
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserCustomer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "File" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
