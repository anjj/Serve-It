# AI Agent Collaboration Guidelines (Gemini & Jules)

This document establishes the rules and cooperation protocols for AI coding agents (specifically Gemini and Jules) working on the `Serve-it` project.

---

## 1. Core Principles

1. **Plan-Centric Execution:**
   - The active track's `plan.md` is the single source of truth for task progress.
   - Every task MUST transition through `[ ]` (pending) $\to$ `[~]` (in progress) $\to$ `[x] <commit-sha>` (completed).

2. **Git Hygiene & Context Preservation:**
   - Commits must use Conventional Commits format (e.g., `feat(auth): ...` or `chore(conductor): ...`).
   - Every completed task commit must have a detailed Git Note summary containing the "why" and files changed, allowing other agents to pick up work seamlessly.

3. **Graphify Synchronization:**
   - Whenever code or documentation is added or modified, run `graphify update .` to rebuild the AST knowledge graph.
   - This ensures the next agent starting a task can query accurate relationships instead of using outdated context.

---

## 2. Agent Roles & Cooperation

- **Gemini:** Primarily acts as the interactive pair programmer, managing track planning, high-level code structure, and specification alignment.
- **Jules:** Focuses on autonomous implementation tasks, script development, domain documentation mapping, and running unit tests.

### Handoff Protocol
When handing off task execution or switching context between agents:
1. **Branch Alignment:** Ensure all changes are on a clean, dedicated task/feature branch.
2. **Commit Check:** Make sure the current task has been committed.
3. **Write Git Note:** Use the `git notes add -m "<summary>"` command on the latest commit hash to describe the state of the task, open issues, and next steps.
4. **Rebuild Graph:** Run `graphify update .` to update the AST graph.

---

## 3. Documentation-Driven Development (DDD)

Both agents must follow the repository-level skills placed in `conductor/skills/`:
- **Planning:** Load and execute `doc-driven-planning` to verify Git safety and map domain impacts.
- **Reviewing:** Load and execute `doc-driven-review` during track completion to scan diffs, identify direct/indirect domain impacts, update `docs/domains/<domain>/how-it-works.md` without code snippets, and verify that the `README.md` is under 50 lines.
