# Plan: Delete Customer Workspace and Purge Data

## Implementation Steps
1. **Recursive Storage Purge:**
   - Implement `deleteCustomerStorage(customerId)` in `src/lib/storage.ts` to recursively find and delete storage files.
2. **API Endpoint DELETE /api/admin/customers:**
   - Create the DELETE handler in `src/routes/api/admin/customers.tsx` to process the recursive storage delete and database customer deletion.
3. **Fail-Closed Session Checks:**
   - Revamp `GET /api/auth/customer-portal` to verify the workspace exists in the database.
4. **Admin UI Confirmation:**
   - Enhance the customer management panel in `src/routes/admin/customers.tsx` with a Delete option and input confirmation matching the slug.
5. **Testing & Verification:**
   - Add unit tests for `deleteCustomerStorage` and route tests for `DELETE /api/admin/customers`.
6. **Documentation:**
   - Update workspace and files architecture domain docs.
