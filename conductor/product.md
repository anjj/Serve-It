# Initial Concept
Inferred context from brownfield project: A multi-tenant file-sharing and serving application with custom workspace URL slugs, API key management, and NextAuth authentication.

# Product Guide: Serve-it

## Product Vision
`Serve-it` is a high-performance, multi-tenant file serving and sharing platform designed for modern organizations and programmatic workflows. It enables organizations (Customers) to create isolated workspaces, manage file assets securely, assign API keys for automated integrations (such as Model Context Protocol servers), and serve files via customizable, human-friendly URLs.

---

## Target Audience
- **Workspace Administrators:** Team leads and IT administrators who configure workspaces, invite users, and manage API integrations.
- **Content Authors / Collaborators:** Standard users within an organization who upload, tag, and organize files.
- **Developers & Programmatic Integrations:** Client applications, CI/CD pipelines, and AI assistants (like MCP agents) that programmatically retrieve or publish files using API keys.

---

## Core Features
1. **Multi-Tenant Architecture:**
   - Strict tenant isolation using PostgreSQL and Prisma schemas.
   - User-to-Customer mapping (many-to-many relationship) to support users participating in multiple workspaces.
2. **File Sharing & Short URLs:**
   - File uploads backed by cloud-native storage (Supabase).
   - Custom slugs for files, exposing clean public/authenticated access paths: `/s/[customer_slug]/[file_slug]`.
3. **API Key Management:**
   - Secure generation and hashing of API keys (`ApiKey`) per Customer.
   - Programmatic authentication for APIs.
4. **Security & Authentication:**
   - Single Sign-On (SSO) and OAuth capability via NextAuth.
   - Admin roles (`isAdmin`) to manage platform-wide operations like customer provisioning.
5. **Model Context Protocol (MCP) Integration:**
   - Native support for MCP servers.
   - AI assistants can list workspaces, upload files, and update files directly within client contexts.

---

## Future Enhancements / Roadmap
- **Granular File Access Control:** Public, private, and password-protected sharing links.
- **Advanced File Metadata & Tagging:** Automated tagging and content extraction.
- **Activity & Access Logs:** Auditing file views and API requests.
