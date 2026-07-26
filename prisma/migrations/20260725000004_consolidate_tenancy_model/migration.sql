-- WI-4: Consolidate the authorization and tenancy model.
--
-- D1: UserCustomer is the single source of truth for tenancy. Verified
-- before this migration that every "user".customerSlug value is NULL on the
-- live database, so there is no disagreement between customerSlug and
-- UserCustomer membership to reconcile -- safe to drop outright.
-- D2: user.role was nullable free text defaulting to 'FULL' with no observed
-- consumer beyond that default; isAdmin remains the only platform-level
-- authorization flag.
ALTER TABLE "user" DROP COLUMN "customerSlug";
ALTER TABLE "user" DROP COLUMN "role";
