---
name: doc-driven-planning
description: Use when drafting implementation plans for the conductor extension to ensure documentation-driven alignment and git hygiene.
---

# Documentation-Driven Planning (Conductor Overlay)

This skill structures the planning phase to ensure code changes are documented and git branches are managed correctly.

## Checklist

You MUST complete each item in order:

- [ ] **1. Git Safety Check:** Verify current branch and `git status`. Include a step in the plan to create a new feature branch if the user is on a main/protected branch.
- [ ] **2. Identify Project Domains:** Map the feature to specific files in `docs/`.
- [ ] **3. Domain-Impact Review Task:** Include a task in the **Review** phase to invoke the `doc-driven-review` skill. This skill diffs the branch against `main`, maps all directly and indirectly-affected domains via cross-domain dependency traversal, and mandates targeted documentation updates for each.
- [ ] **4. Minimalist README Check:** Ensure the root `README.md` remains a simple map to the `/docs` folder.

## Rules

- **Branching:** Always assume changes will be handled via PR/MR. The plan must reflect an isolated branch workflow.
- **Verification:** An implementation is only "done" if the `docs/` reflect the changes and the `README.md` remains under 50 lines.
