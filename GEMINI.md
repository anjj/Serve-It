# Gemini & Jules AI Developer Workspace

This repository is configured with a structured development workflow and specific collaboration protocols that you MUST follow.

---

## 1. Project Context & Rules

All core specifications, guidelines, and rules are located under the `conductor/` directory. Before writing any code, you must read:
- **Project Context & Tech Stack:** [conductor/index.md](./conductor/index.md)
- **Workflow & TDD Guidelines:** [conductor/workflow.md](./conductor/workflow.md)
- **AI Agent Collaboration Rules:** [conductor/agent-rules.md](./conductor/agent-rules.md)

---

## 2. Active Tracks & Tasks

To check current development tracks, status, or to start a new track:
- **Tracks Registry:** [conductor/tracks.md](./conductor/tracks.md)

---

## 3. General Workflow for AI Agents

1. **Check the Active Track:** Locate the active track marked with `[~]` in `conductor/tracks.md`.
2. **Follow the Plan:** Read that track's local `plan.md` (e.g., `conductor/tracks/<track_id>/plan.md`).
3. **Execute Task Workflow:**
   - Mark the task as in-progress `[~]`.
   - Write unit tests first (TDD).
   - Implement minimal code to pass tests.
   - Commit code with conventional commit messages.
   - Attach a Git Note summary to the commit.
   - Update the plan file task status to `[x]` with the commit SHA and commit the plan.
