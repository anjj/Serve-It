# Implementation Plan: Gemini & Jules Agent Rules

## Phase 1: Shared Skills Setup
- [x] Task: Copy local `ddd-conductor` skills to `conductor/skills/` [51a6741]
    - [x] Create `conductor/skills/doc-driven-planning/SKILL.md`
    - [x] Create `conductor/skills/doc-driven-review/SKILL.md`
    - [x] Create `conductor/skills/ddd-nextjs/SKILL.md`
    - [x] Create `conductor/skills/ddd-generic/SKILL.md`
    - [x] Create `conductor/skills/init/SKILL.md`
- [ ] Task: Create AI Agent rules file
    - [ ] Create `conductor/agent-rules.md` detailing collaboration, state sharing, and handoff protocols between Gemini and Jules
- [ ] Task: Create master `GEMINI.md` in repository root
    - [ ] Create `GEMINI.md` linking to `conductor/` guidelines and `conductor/agent-rules.md`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Shared Skills Setup' (Protocol in workflow.md)

## Phase 2: Index and Graph Integration
- [ ] Task: Register new files in Conductor index
    - [ ] Update `conductor/index.md` to reference `GEMINI.md`, `agent-rules.md`, and the copied skills
- [ ] Task: Run graphify update to index all new files
    - [ ] Execute `graphify update .` to update the knowledge graph
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Index and Graph Integration' (Protocol in workflow.md)
