---
name: plan-mdoc-core-build
description: Generate an implementation approach plan for an mdoc core build Jira ticket. Splits the ticket into small TDD phases, each independently testable and committable.
---

# Plan mdoc Core Build Ticket

Generate an implementation approach for the following Jira ticket:

$ARGUMENTS

`$ARGUMENTS` is a file path to a Markdown (`.md`) export of the Jira ticket. Read this file to obtain the ticket content. If the path does not exist or cannot be read, stop immediately and report this to the user rather than proceeding on assumptions or partial information.

---

## Instructions

You are producing an implementation approach document for a ticket in the mobile-wallet-mdoc-builder project. The approach must be output to the chat for review during planning. Do not write the approach document to disk until Step 3 (the interview) has concluded and the plan has been approved — see Step 4.

### Step 1: Gather Context

Before planning, read the following to understand the project:

1. **Project conventions** — read `AGENTS.md` and `README.md` in the repository root.
2. **Architecture** — read `docs/component-architecture.md`.
3. **CBOR test guide** — read `docs/cbor-test-guide.md`.
4. **Existing source** — explore `src/` to understand the current module structure, patterns, and what has been implemented.
5. **Git history** — run `git log --oneline -40` to understand what work has been completed. Only read commit titles.
6. **Core build structure** — if `context/core_build_structure.md` exists, read it to understand the full work package and how this ticket fits within it.
7. **Type definitions** — read `src/types/` to understand the public API contract.

### Step 2: Analyse the Ticket

Study the Jira ticket read from the file path in `$ARGUMENTS`. Identify:

- What the ticket requires (functional requirements).
- What is explicitly out of scope.
- What upstream dependencies exist (modules that must exist before this one).
- What downstream consumers will use this module's output.
- What decisions are unresolved (TBDs, ambiguities, open questions).

### Step 3: Interview

Interview the user relentlessly about every aspect of the plan until a shared understanding is reached. Walk down each branch of the design tree, resolving dependencies between decisions one by one.

For every open question:

1. **Explore first.** Check whether the ticket, `AGENTS.md`, `docs/component-architecture.md`, `docs/cbor-test-guide.md`, `context/core_build_structure.md`, or the existing patterns in `src/` (especially `src/cbor/`, `src/deviceKey/`, `src/validityInfo/`, `src/issuerSigned/`) already answer it.
2. **Only ask if unresolved.** If exploration settles the question, state the answer and its source (e.g. "per `src/deviceKey/`, errors are thrown as `ValidationError`, not returned as a `Result`") instead of asking the user to confirm something already established.
3. **Recommend, don't just ask.** For each question actually put to the user, provide a recommended answer based on the ticket, project conventions, and codebase patterns, so the user is confirming or correcting rather than starting from a blank page.

**Group questions by design-tree branch, and ask one group at a time.** Do not dump every open question in a single message. Instead:

- After exploration, cluster the remaining open questions into coherent groups — e.g. "CBOR encoding shape," "error handling convention," "test fixture format," "upstream/downstream interface," "phase boundaries." A group should share a dependency: questions in a later group may depend on answers from an earlier one, but questions within a group should be answerable together without waiting on each other.
- Order the groups so that groups gating the most downstream decisions come first (e.g. resolve the interface/contract shape before asking about test fixtures for that interface).
- Present one group at a time, with each question's recommended answer included. Wait for the user's response before moving to the next group.
- If the user's answer in one group changes the premise of a later group's questions (e.g. an error-handling choice changes what "error path" fixtures look like), revise that later group before presenting it rather than asking the original, now-outdated version.
- Do not proceed to the next group until the current group's questions are resolved, and do not proceed to Step 4 until all groups are resolved.

Do not proceed to Step 4 until all questions are resolved.

### Step 4: Produce the Approach Document

Once all questions are resolved, write the approach document to disk at `context/<ticket-id>-approach.md` (create the `context/` directory if it does not exist) and also output it to chat for review, using the format below.

This file is a **living document**, not a one-shot artifact:

- The `Progress` table's `Status` column must be updated as each phase is completed (e.g. ⬜ → 🟩), and the file re-saved, so the plan reflects real state across sessions.
- Updating the status column is part of the per-phase verification/commit flow (see Principles), not a separate manual step to remember later.

---

## Approach Document Format

````markdown
# <Ticket Title> — Implementation Approach

## Summary

<One paragraph describing what this module does, what it accepts, what it produces, and where it fits in the architecture.>

## Principles

- **TDD** — tests are written before production code at every step.
- **Phased** — each phase is a logical, self-contained unit of work that delivers one testable chunk of the ticket.
- **Commit per phase** — tests pass and the build is green before each commit.
- **Verification** — after each phase, `npm run lint`, `npm run typecheck`, and `npm run format` are executed to ensure code quality.
- **Context check** — before starting each phase, read the commits on the current branch (`git log --oneline main..HEAD`) to understand what work has already been completed.
- **Progress tracking** — after each phase's commit, update the `Status` column in the `Progress` table below and re-save this file.

---

## Progress

Update as each phase is done

| Phase | Description           | Status | Notes |
| ----- | --------------------- | ------ | ----- |
| 1     | <phase 1 description> | ⬜     |       |
| 2     | <phase 2 description> | ⬜     |       |
| ...   | ...                   | ⬜     |       |

---

## Upstream Dependencies

<List modules that must exist before this one can be built. Note any coordination points.>

## Downstream Consumers

<List modules that will consume this module's output. Note the expected interface shape.>

---

## Phase 1: <Title>

### Setup

<Directory and file creation instructions if this is the first phase.>

### Tests (written first)

<Bullet list of test cases to write before implementation.>

### Implementation

<Numbered steps describing what to implement to make the tests pass.>

### Commit

`<conventional commit message>`

---

## Phase N: <Title>

<Same structure as Phase 1 for each subsequent phase.>

---

## Testing Strategy

| Layer                           | Tool   | Location                               |
| ------------------------------- | ------ | -------------------------------------- |
| Unit tests                      | Vitest | `src/<module>/<file>.test.ts`          |
| Encoding tests (if CBOR output) | Vitest | `src/<module>/<file>.encoding.test.ts` |

<Notes on test approach, mocking strategy, coverage expectations.>

---

## File Structure (final)

```md
src/
└── <module>/
├── index.ts
├── <file>.ts
├── <file>.test.ts
└── helpers/
├── <file>.ts
└── <file>.test.ts
```
````

---

## Design Decisions

| Decision   | Rationale |
| ---------- | --------- |
| <decision> | <why>     |
| ...        | ...       |

```

---

## Key Rules for Phase Design

1. **Each phase must be logical and self-contained** — a phase delivers one clearly-scoped, testable chunk of the ticket (e.g. one function, one helper, one encoder, one validation concern). There is no fixed phase count or time budget: granularity depends on the nature of the task, and the user will guide how finely to split a given plan during the interview.
2. **Each phase uses TDD** — tests are written first, then implementation makes them pass.
3. **Each phase ends with verification** — before committing, run:
    - `npm test` (all tests pass)
    - `npm run lint` (no lint errors)
    - `npm run format` (code is formatted)
    - `npm run typecheck` (no type errors)
4. **Each phase has a conventional commit** — the commit message follows the project's conventional commit format.
5. **Phases build on each other** — later phases may depend on earlier ones, but each is independently testable.
6. **Module boundary enforcement** — the final phase must ensure the barrel export (`index.ts`) exposes only the public API. No internal types or third-party types leak.
7. **Coverage must be effectively 100%** — every branch, including error paths, must be tested.
8. **Follow existing patterns** — match the structure of `src/cbor/`, `src/deviceKey/`, `src/validityInfo/`, and `src/issuerSigned/` for directory layout, test style, and barrel exports.
```
