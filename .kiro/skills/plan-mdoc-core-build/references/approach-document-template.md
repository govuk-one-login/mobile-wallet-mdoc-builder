# Approach Document Template

Write the approach document to disk at `context/<ticket-id>-approach.md` (create the `context/` directory if it does not exist) and also output it to chat for review, using the format below.

This file is a **living document**, not a one-shot artifact:

- The `Progress` table's `Status` column must be updated as each phase is completed (e.g. ⬜ → 🟩), and the file re-saved, so the plan reflects real state across sessions.
- Updating the status column is part of the per-phase verification/commit flow (see Principles), not a separate manual step to remember later.

---

## Template

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
