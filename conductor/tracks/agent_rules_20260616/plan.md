# Implementation Plan: Gemini & Jules Agent Rules

## Phase 1: Shared Skills Setup [checkpoint: f89ff43]
- [x] Task: Copy local `ddd-conductor` skills to `conductor/skills/` [51a6741]
    - [x] Create `conductor/skills/doc-driven-planning/SKILL.md`
    - [x] Create `conductor/skills/doc-driven-review/SKILL.md`
- [x] Task: Create AI Agent rules file [3b240c0]
    - [x] Create `conductor/agent-rules.md` detailing collaboration, state sharing, and handoff protocols between Gemini and Jules
- [x] Task: Create master `GEMINI.md` in repository root [f3e13dc]
    - [x] Create `GEMINI.md` linking to `conductor/` guidelines and `conductor/agent-rules.md`
- [x] Task: Conductor - User Manual Verification 'Phase 1: Shared Skills Setup' (Protocol in workflow.md)

## Phase 2: Index and Graph Integration
- [x] Task: Register new files in Conductor index [9e4de2c]
    - [x] Update `conductor/index.md` to reference `GEMINI.md`, `agent-rules.md`, and the copied skills
- [x] Task: Run graphify update to index all new files [c68e54d]
    - [x] Execute `graphify update .` to update the knowledge graph
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Index and Graph Integration' (Protocol in workflow.md)
