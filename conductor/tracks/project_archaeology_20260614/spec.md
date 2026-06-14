# Specification: Project Archaeology

## 1. Goal
Initialize a Documentation-Driven Development (DDD) environment by performing an initial discovery of the codebase structure, identifying business domains, and generating detailed domain documentation to facilitate future development.

## 2. Discovered Domains
1. **Authentication (Auth)**: SSO Azure AD Entra ID authentication and local Developer bypass configurations.
2. **Workspaces (Multi-Tenancy)**: Isolation, workspace boundaries, user membership mapping, and admin-only settings.
3. **Files**: File ingestion (restricting to `.html`), database indexing, metadata cataloging, and storage persistence.
4. **Document Serving Layer**: Human-friendly document serving path `/s/[customer_slug]/[file_slug]`, access-rights resolution, and strict caching headers.
5. **API Keys**: Programmatic authentication, one-time raw key creation, and secure SHA-256 database key hashing.

## 3. Scope of Artifacts
- **Domain Docs**: `docs/domains/auth.md`, `docs/domains/workspaces.md`, `docs/domains/files.md`, `docs/domains/serving.md`, `docs/domains/apikeys.md`.
- **System Map**: Updated main `README.md` with links and badges.
- **Archiving / Track Setup**: Registering this discovery process under the Conductor framework.
