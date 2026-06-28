# Specification: Update MCP Documentation Feature

## Overview

Create comprehensive documentation for the Model Context Protocol (MCP) integration in Serve-it. This includes a new standalone MCP guide (`docs/MCP_GUIDE.md`), a new domain knowledge document (`docs/domains/mcp.md`), and updates to the project README to surface MCP as a first-class integration capability.

The documentation targets **Workspace Administrators** who need to configure MCP access for their organization and connect AI assistants (e.g., ChatGPT) to their Serve-it workspace.

**Track Type:** Documentation (no code changes to API or MCP logic).

---

## Functional Requirements

### FR-1: MCP Domain Documentation (`docs/domains/mcp.md`)
- Create a new domain document following the existing domain doc format (see `docs/domains/apikeys.md` for reference).
- Explain how MCP integration works at a high level (non-technical summary).
- Document the architecture: how Serve-it exposes file operations as MCP tools, the role of API keys as authentication, and the Bearer token setup.
- Document the relationship between API keys, customer workspaces, and MCP tool access.
- Include technical implementation details and business rules relevant to MCP.

### FR-2: MCP Setup Guide (`docs/MCP_GUIDE.md`)
- Create a comprehensive, user-facing guide for setting up MCP integration.
- **Sections to include:**
  1. **Introduction** — What MCP is and how Serve-it supports it.
  2. **Prerequisites** — API key generation, workspace setup.
  3. **Authentication Setup** — Access Token / API Key with Bearer setup; explain that the user's API key must be provided as the Bearer token.
  4. **ChatGPT Custom App Setup** — Step-by-step instructions for configuring a ChatGPT custom app with the MCP configuration, including:
     - Screenshot placeholder for ChatGPT setup: `![ChatGPT MCP Setup](./assets/serve-it_setup-chatgpt.png)`
     - Screenshot placeholder for available tools: `![Serve-it MCP Tools](./assets/serve-it_tools.png)`
  5. **Available MCP Tools** — List and describe the tools exposed by Serve-it via MCP (file upload, file update, etc.).
  6. **Troubleshooting** — Common issues and their resolutions.

### FR-3: README Update
- Add a new **"🤖 MCP Integration"** section to the README.md.
- Include a brief summary of the MCP capability.
- Link to the detailed guide at `docs/MCP_GUIDE.md`.
- Add `docs/domains/mcp.md` to the Domain Documentation list in the README.

---

## Non-Functional Requirements

- **NFR-1:** All documentation must be written in English only.
- **NFR-2:** Follow the existing documentation format and style established in `docs/domains/` (professional, concise, technical).
- **NFR-3:** Use product guidelines tone: direct, technical, objective. Avoid unnecessary conversational fluff.
- **NFR-4:** Screenshots must reference existing assets at `docs/assets/serve-it_setup-chatgpt.png` and `docs/assets/serve-it_tools.png`.

---

## Acceptance Criteria

1. A new file `docs/domains/mcp.md` exists and follows the domain doc format with sections: How It Works, Architecture, Technical Implementation & Business Rules, and Diagnostics.
2. A new file `docs/MCP_GUIDE.md` exists with step-by-step setup instructions including the ChatGPT custom app configuration walkthrough.
3. The guide embeds the two existing screenshot assets (`serve-it_setup-chatgpt.png`, `serve-it_tools.png`) in appropriate locations.
4. `README.md` contains a new MCP Integration section with a link to the guide.
5. `README.md` Domain Documentation list includes the new MCP domain doc.
6. All documentation is in English, uses consistent terminology, and matches the project's professional tone.

---

## Out of Scope

- No code changes to API routes, MCP server logic, or any TypeScript/React components.
- No new screenshots or image assets (existing assets will be used).
- No translations or multi-language support.
- No changes to the Prisma schema or database.
