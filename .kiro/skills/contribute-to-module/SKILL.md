---
name: contribute-to-module
description: Implement a module or change in the mobile-wallet-mdoc-builder project, phase by phase using TDD. Works from an existing approach plan, a user-typed brief, or no written plan at all — in every case following the shared phasing strategy. Verifies with a single gate, keeps docs in sync, and leaves each phase committable without committing.
---

# Contribute to a Module

Implement a change in the mobile-wallet-mdoc-builder project, one phase at a time, using TDD.

The mechanical conventions this skill relies on — module structure, the TDD cycle, the two-layer CBOR
testing strategy, architecture boundaries, and commit conventions — are defined in
[`AGENTS.md`](../../../AGENTS.md) and are not restated here.

How the work is split into phases is governed by the shared
[`phase-design-rules.md`](../shared/references/phase-design-rules.md) — the **same** strategy the
`plan-mdoc-core-build` skill uses to craft a written plan. Whether or not a written plan exists, phased
work follows that reference: logical self-contained phases, TDD ending in the single verification gate,
the final phase enforcing the module boundary, and stopping for human review at each phase boundary.

## Resolve the plan input

This skill does not assume a written plan already exists. Before implementing, determine which of three
input modes applies. If it is ambiguous which mode the user intends, ask them.

**Mode 1 — an existing approach document.** A plan produced by `plan-mdoc-core-build` exists at
`context/<ticket-id>-approach.md`. Do not guess the filename: confirm the ticket id / path with the user
or list `context/` to identify it. Read the approach document in full and identify:

- the ordered phases and their current `Status` in the Progress table;
- the next phase whose status is not done;
- that phase's tests, implementation steps, and proposed commit message.

Then proceed to the [per-phase workflow](#per-phase-workflow).

**Mode 2 — a user-typed plan or brief.** The user pastes a plan or a free-form brief into the chat
instead of pointing at a document. Treat it as the source of intent and derive the phasing yourself via
the [lightweight planning sub-flow](#lightweight-planning-when-there-is-no-written-plan) below — the
brief does not need to be pre-structured into phases.

**Mode 3 — no written plan.** Neither a document nor a typed plan is provided; you have only the task
described in the conversation. Derive the phasing via the
[lightweight planning sub-flow](#lightweight-planning-when-there-is-no-written-plan) below.

## Lightweight planning (when there is no written plan)

Used by Mode 2 and Mode 3. The goal is to reach the same phased rigor as a written approach document
without requiring one up front.

1. **Derive phases.** Break the brief or task into phases that satisfy the shared
   [`phase-design-rules.md`](../shared/references/phase-design-rules.md). Explore the codebase as needed
   (existing `src/<module>/` patterns, `AGENTS.md`, `docs/`) so the breakdown fits the project.
2. **Present the breakdown.** Show the ordered phase list to the user — each phase with a short
   description and its intended tests — and get agreement before writing any code. Revise on feedback.
3. **Offer to persist.** Ask the user whether they want the breakdown written down as
   `context/<ticket-id>-approach.md`. If yes, write it using the shape defined in
   [`../plan-mdoc-core-build/references/approach-document-template.md`](../plan-mdoc-core-build/references/approach-document-template.md)
   (including the `Progress` table). If no, keep the agreed breakdown as the in-session plan and track
   progress in the conversation instead.
4. **Proceed.** Enter the [per-phase workflow](#per-phase-workflow) for the first phase.

## Per-phase workflow

For the next incomplete phase, in order:

1. **Context check.** Run `git log --oneline main..HEAD` to confirm what is already committed.
2. **Write the tests first.** Follow the phase's test list and the module structure defined in
   [`AGENTS.md#module-structure`](../../../AGENTS.md#module-structure). Do **not** run the suite yet.
3. **Implement.** Write the minimum production code to satisfy the tests. Keep code self-documenting;
   do not add verbose comments.
4. **Sync the docs.** Apply the documentation obligations in
   [`../shared/references/doc-sync-map.md`](../shared/references/doc-sync-map.md) that the change
   triggers.
5. **Verify once.** Run `npm run verify` a single time to validate the whole phase (lint, format check,
   typecheck, and tests). Do not run the test suite earlier in the cycle.
6. **Leave it committable.** Record that the phase is done: if a written approach document backs this
   work (Mode 1, or Mode 2/3 when the user chose to persist), update its Progress table (`⬜` → `🟩`)
   and re-save it; otherwise note the phase's completion in the in-session plan. Then follow the commit
   convention in `AGENTS.md` — propose the message, never run the commit.

Then stop for human review, and continue to the next phase only when instructed.

## References

Shared references (Layer 2 — followed whether or not a written plan exists):

- [`../shared/references/phase-design-rules.md`](../shared/references/phase-design-rules.md) — the shared
  phasing strategy.
- [`../shared/references/doc-sync-map.md`](../shared/references/doc-sync-map.md) — which change requires
  which doc update.

Skill-local references (Layer 3):

- [`../plan-mdoc-core-build/references/approach-document-template.md`](../plan-mdoc-core-build/references/approach-document-template.md)
  — the approach-document shape, used when persisting a lightweight plan.

Module layout is defined in [`AGENTS.md#module-structure`](../../../AGENTS.md#module-structure).
