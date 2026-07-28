# Specification: Delete Customer Workspace and Purge Data

## Overview
Workspaces (Customer) can be created from /admin/customers but never permanently removed. To comply with GDPR Art. 17 data-deletion requests, prevent test workspace clutter, and keep storage utilization bounded, platform administrators must be able to permanently delete any customer workspace, removing all database records and storage bucket assets.

## Functional Requirements
1. **Recursive Storage Purge:**
   - Walk the `tenants/<customerId>/` storage prefix recursively and delete all nested objects in paginated batches of <= 100.
2. **Cascading Database Deletion:**
   - Execute a safe `DELETE /api/admin/customers` endpoint.
   - Deleting the `Customer` row cascades and removes related `File` metadata rows and `UserCustomer` workspace memberships.
3. **Fail-Closed Session Protection:**
   - Verify that any subsequent or existing stateless sessions (such as Customer Portal cookie logins) fail-closed by re-resolving the Customer record in the database on every portal-reachable route.
4. **Admin UI Inline Confirmation:**
   - Prompt the platform admin to type the exact customer slug to confirm deletion.
   - Surface error logs and API responses on the UI.

## Acceptance Criteria
- Storage bucket prefix `tenants/<customerId>/` contains zero objects after deletion.
- Customer, UserCustomer, and File rows are permanently deleted.
- Member User accounts and their associated API keys remain intact.
- Fail-closed security returns 404/redirect for deleted workspaces on all public and portal routes.
- Fully tested with comprehensive unit and integration test coverage.
