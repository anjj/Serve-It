-- D4: ApiKey belongs to exactly one User (the MCP/programmatic caller), not
-- to a single Customer. Workspace scope is resolved per-request against
-- that user's UserCustomer memberships (see D4 and the apikeys.md rewrite),
-- so a key stays valid across every workspace the user has access to
-- instead of being pinned to one Customer at creation time.
-- Verified before this migration that every live ApiKey row already has
-- userId set and customerId NULL, so this is a no-op on existing data.
ALTER TABLE "ApiKey" DROP COLUMN "customerId";
ALTER TABLE "ApiKey" ALTER COLUMN "userId" SET NOT NULL;
