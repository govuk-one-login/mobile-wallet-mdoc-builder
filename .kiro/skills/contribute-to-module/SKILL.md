---
name: contribute-to-module
description: Implement a module or change in the mobile-wallet-mdoc-builder project from an existing approach plan. Drives implementation phase by phase using TDD, verifies with a single gate, keeps docs in sync, and leaves each phase committable without committing.
---

# Contribute to a Module

Implement a change in the mobile-wallet-mdoc-builder project by executing an existing approach plan,
one phase at a time.

This skill assumes the mechanical conventions in [`AGENTS.md`](../../../AGENTS.md) — module structure,
the TDD cycle, the two-layer CBOR testing strategy, architecture boundaries, and commit conventions. It
references those rules rather than restating them; read `AGENTS.md` before starting.

## Precondition: a plan must exist

This skill is the **build** half of a plan-first-then-build pipeline. Before running it, an approach
document produced by the `plan-mdoc-core-build` skill must exist at `context/<ticket-id>-approach.md`.
If no such plan exists, stop and run `plan-mdoc-core-build` first — do not improvise a plan here.

Read the approach document in full and identify:

- the ordered phases and their current `Status` in the Progress table;
- the next phase whose status is not done;
- that phase's tests, implementation steps, and proposed commit message.

## Per-phase workflow

For the next incomplete phase, in order:

1. **Context check.** Run `git log --oneline main..HEAD` to confirm what is already committed.
2. **Write the tests first.** Follow the phase's test list and the module structure in
   [`references/module-structure.md`](references/module-structure.md). Do **not** run the suite yet.
3. **Implement.** Write the minimum production code to satisfy the tests. Keep code self-documenting;
   do not add verbose comments.
4. **Sync the docs.** Apply the documentation obligations in
   [`references/doc-sync-map.md`](references/doc-sync-map.md) that the change triggers.
5. **Verify once.** Run `npm run verify` a single time to validate the whole phase (lint, format check,
   typecheck, and tests). Do not run the test suite earlier in the cycle.
6. **Leave it committable.** Update the plan's Progress table (`⬜` → `🟩`) and re-save the approach
   document. Propose the phase's conventional commit message for the human. **Never execute or propose
   to execute the commit command** — the human reviews and commits.

Then stop, or continue to the next phase if instructed.

## References

- [`references/module-structure.md`](references/module-structure.md) — the module layout checklist.
- [`references/doc-sync-map.md`](references/doc-sync-map.md) — which change requires which doc update.
