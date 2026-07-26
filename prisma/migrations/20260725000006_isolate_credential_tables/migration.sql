-- WI-5: Isolate credential-bearing tables (defense in depth).
--
-- "account" (better-auth OAuth tokens + password hash) and "ApiKey"
-- (hashed API keys) are pure credential tables; Customer.passwordHash is a
-- credential column on an otherwise non-sensitive table. RLS-with-no-policy
-- already denies anon/authenticated access, but Supabase's default grants
-- give those roles full CRUD privileges at the grant level -- a single
-- accidentally permissive RLS policy added later would immediately expose
-- these columns. Revoking the grants outright means a stray policy alone
-- can no longer leak them; only an explicit GRANT would. This does not
-- affect the application, which connects as the table-owning Prisma role.
REVOKE ALL ON TABLE "account" FROM anon, authenticated;
REVOKE ALL ON TABLE "ApiKey" FROM anon, authenticated;
REVOKE ALL ("passwordHash") ON TABLE "Customer" FROM anon, authenticated;
