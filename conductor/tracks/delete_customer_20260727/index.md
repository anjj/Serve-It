# Track: Delete Customer Workspace and Purge Data

This track introduces the ability for platform administrators to permanently and irreversibly delete customer workspaces. The deletion safely purges all associated HTML objects in Supabase storage, cascadingly removes all metadata files and user membership records from Postgres, and ensures stateless portal sessions fail-closed immediately.

## Documents
- [Specification](./spec.md)
- [Execution Plan](./plan.md)

## Status
- **Status:** Completed
- **Created:** 2026-07-27
- **Completed:** 2026-07-27
