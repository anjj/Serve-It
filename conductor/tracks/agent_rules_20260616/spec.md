# Specification: Gemini & Jules Agent Rules

## Overview
This track introduces clear, shareable guidelines and local agent rules within the repository. It includes establishing a master `GEMINI.md` file at the root, defining specific agent collaboration protocols in `conductor/agent-rules.md`, and copying the local `doc-driven-development` skills into `conductor/skills/` so they are accessible and enforceable for all AI agents (including Jules) working on the repository.

## Functional Requirements
1. **Master Guidelines File (`GEMINI.md`):**
   - Create `GEMINI.md` in the root of the repository as the primary entry point for AI agents.
   - Point agents to read the `conductor/` directory for product context, stack rules, and workflows.
2. **Agent Collaboration Protocols (`conductor/agent-rules.md`):**
   - Define roles and boundaries for Gemini and Jules.
   - Specify cooperation, handoff protocols, git hygiene, and how state is communicated during task execution.
3. **Repository-Level Skills (`conductor/skills/`):**
   - Copy the `ddd-conductor` skills (`ddd-nextjs`, `ddd-generic`, `doc-driven-planning`, `doc-driven-review`, `init`) into `conductor/skills/`.
   - Update instructions to clarify that agents must load and follow these skills.

## Non-Functional Requirements
- Documentation must be written in English and follow standard markdown conventions.
- All file paths inside documentation should be relative to work seamlessly in any local or CI environment.

## Acceptance Criteria
- [ ] `GEMINI.md` exists in the repository root and links to the Conductor documentation.
- [ ] `conductor/agent-rules.md` is present and details collaboration/handoff protocols between Gemini and Jules.
- [ ] The `conductor/skills/` directory contains all 5 `ddd-conductor` skills (`ddd-nextjs`, `ddd-generic`, `doc-driven-planning`, `doc-driven-review`, `init`).
- [ ] `conductor/index.md` is updated to register the new files.
- [ ] `graphify update .` is executed and runs successfully.

## Out of Scope
- Code changes to the main `serve-it` application logic.
- Setting up external CI/CD integrations.
