# Implementation Plan: Update MCP Documentation Feature

## Phase 1: MCP Domain Documentation [checkpoint: 925de57]

- [x] Task: Create MCP domain document (`docs/domains/mcp.md`) `7a03316`
    - [ ] Research existing MCP-related code in `src/app/api/v1/files/route.ts`, `src/lib/storage.ts`, and the `@modelcontextprotocol/sdk` dependency to understand MCP tool capabilities.
    - [ ] Draft the "How It Works" non-technical summary section explaining MCP integration at a high level.
    - [ ] Draft the architecture section documenting how Serve-it exposes file operations (upload, update) as MCP tools, API key authentication flow, and Bearer token setup.
    - [ ] Draft the "Technical Implementation & Business Rules" section detailing MCP tool endpoints, request/response formats, and workspace-scoped access.
    - [ ] Draft the "Diagnostics & Error Handling" table with common MCP-related errors and resolutions.
    - [ ] Write the final `docs/domains/mcp.md` file following the format of `docs/domains/apikeys.md`.

- [x] Task: Conductor - User Manual Verification 'Phase 1: MCP Domain Documentation' (Protocol in workflow.md) `925de57`

## Phase 2: MCP Setup Guide [checkpoint: b21cf6b]

- [x] Task: Create MCP setup guide (`docs/MCP_GUIDE.md`) `0235a9b`
    - [ ] Write the Introduction section explaining what MCP is and how Serve-it supports it.
    - [ ] Write the Prerequisites section covering API key generation and workspace setup requirements.
    - [ ] Write the Authentication Setup section detailing Access Token / API Key with Bearer configuration.
    - [ ] Write the ChatGPT Custom App Setup section with step-by-step instructions for configuring the MCP connection in ChatGPT.
    - [ ] Embed screenshot assets: `./assets/serve-it_setup-chatgpt.png` (ChatGPT setup) and `./assets/serve-it_tools.png` (available tools).
    - [ ] Write the Available MCP Tools section listing and describing each tool exposed by Serve-it.
    - [ ] Write the Troubleshooting section with common issues and resolutions.

- [x] Task: Conductor - User Manual Verification 'Phase 2: MCP Setup Guide' (Protocol in workflow.md) `b21cf6b`

## Phase 3: README Update

- [x] Task: Update README.md with MCP integration section `e3963c4`
    - [ ] Add `docs/domains/mcp.md` entry (item 6) to the existing Domain Documentation list in README.md.
    - [ ] Add a new "🤖 MCP Integration" section after the Domain Documentation section with a brief summary and link to `docs/MCP_GUIDE.md`.

- [~] Task: Conductor - User Manual Verification 'Phase 3: README Update' (Protocol in workflow.md)
