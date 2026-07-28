# Specification: Permanent User Deletion and Data Purge

## Overview
User accounts can be created and managed, but there is currently no way for platform administrators to permanently remove one. To comply with GDPR Art. 17 data-deletion requests, offboard staff, and clean up stale test accounts, administrators must be able to permanently delete any user account, removing all database records associated with the user while leaving workspace/customer storage files untouched.

## Functional Requirements
1. **POST /api/admin/users/delete Endpoint:**
   - Deletes a user by ID.
   - Requires admin session (`withAdmin`).
   - Ensures target user exists, confirmEmail matches, and enforces self-deletion and last-admin guards.
2. **Cascading Database Deletion:**
   - Foreign key cascading deletes matching `Session`, `Account`, `ApiKey`, and `UserCustomer` rows automatically when the `User` row is deleted.
3. **Admin UI Inline Confirmation:**
   - Safe confirmation panel requiring the typed user email before executing deletion.
   - Disabled delete option for the active admin's own account.
   - Shows API errors.

## Acceptance Criteria
- Caller must be an admin; unauthorized/non-admin requests return 401.
- Self-deletion and deleting the last remaining admin are prohibited (returns 400).
- Confirm email must match exactly (returns 400).
- Deleted user's sessions are terminated immediately.
- Shared customer workspaces and uploaded files remain unaffected.
