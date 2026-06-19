---
name: doc-driven-review
description: Use at the Review phase of a conductor track to inspect applied changes, map impacted domains (direct and cross-domain), and enforce targeted documentation updates.
---

# Documentation-Driven Review

This skill grounds the Review phase in the actual changes made — not a generic documentation pass. It maps changed files to business domains, traverses cross-domain dependencies in existing docs, and mandates targeted documentation updates for every affected domain.

## Instructions

Complete each step in order.

### 1. Change Inspection

Enumerate every file changed on this feature branch:

```
git diff main...HEAD --name-only
git status
```

Build a complete list of modified files. Include both committed changes (diff vs. `main`) and any uncommitted staged/unstaged changes.

### 2. Direct Domain Mapping

For each changed file, determine which business domain it belongs to:

- Cross-reference against `docs/domains/` — each subfolder represents a domain.
- Use framework heuristics:
  - **Symfony:** `src/Entity/`, `src/Service/` etc. filenames map to named domains.
  - **Next.js:** `app/<route>/`, `components/features/<domain>/` directory names.
  - **Generic:** Top-level directory names under the main source root.
- A single file may touch multiple domains (e.g., shared utilities) — flag all of them.

Output: a `Changed File → Domain` table.

### 3. Cross-Domain Impact Analysis

For each directly-affected domain from Step 2:

- Read its `docs/domains/<domain>/how-it-works.md`.
- Scan for cross-domain dependency references (interaction graphs, dependency tables, explicit "this domain calls X" language).
- Add any referenced domains to the impacted list as **indirectly affected**.
- Repeat for each newly-added domain (max 3 hops to prevent runaway traversal).

Produce a **Domain Impact Map**:

| Domain | Impact Type | Reason |
|--------|-------------|--------|
| Payments | Direct | `src/Service/PaymentService.php` modified |
| Invoicing | Indirect | Payments docs reference Invoicing for billing events |

### 4. Documentation Gap Check

For each domain in the Impact Map:

- Confirm `docs/domains/<domain>/how-it-works.md` exists.
- Compare documented behavior against the actual changes from Step 1.
- Identify and list sections that are now stale or missing.

### 5. Targeted Documentation Update

For each affected domain, update or create `docs/domains/<domain>/how-it-works.md`:

- Reflect only changes relevant to that domain — do not rewrite accurate sections.
- Follow `conductor/product-guidelines.md` documentation standards:
  - No code snippets
  - ASCII diagrams for data and execution flows
  - Tables for validation rules, HTTP codes, and error mappings
  - Non-technical "How it Works" summary for consultants and RAG systems

### 6. Review Sign-Off Checklist

The Review phase is **not complete** until:

- [ ] Every directly-affected domain has updated documentation
- [ ] Every indirectly-affected domain is either updated or explicitly confirmed as unaffected
- [ ] No code snippets appear in any documentation file
- [ ] The Domain Impact Map has been reviewed and acknowledged by the user
- [ ] `README.md` is updated if new domains were added or removed
