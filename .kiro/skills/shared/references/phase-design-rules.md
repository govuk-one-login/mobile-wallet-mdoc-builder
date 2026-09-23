# Key Rules for Phase Design

The mechanical conventions an agent must obey while implementing are defined
in [`AGENTS.md`](../../../../AGENTS.md) and are not restated here. This file adds only the rules that shape
how a ticket is split into phases.

This is the **shared** phasing strategy for the mdoc-builder skills. Both `plan-mdoc-core-build` (when
crafting a written approach) and `contribute-to-module` (when implementing without a written approach)
follow these rules so that phased work is identical whether or not a plan document exists.

1. **Each phase must be logical and self-contained** — a phase delivers one clearly-scoped, testable chunk of the ticket (e.g. one function, one helper, one encoder, one validation concern). There is no fixed phase count or time budget: granularity depends on the nature of the task, and the user will guide how finely to split a given plan during the interview.
2. **Phases build on each other** — later phases may depend on earlier ones, but each is independently testable.
3. **Each phase is TDD and ends with the verification gate** — tests are written first; the phase ends by running `npm run verify` once (see `AGENTS.md`), then is left committable following the `AGENTS.md` commit convention.
4. **The final phase enforces the module boundary** — confirm the barrel export exposes only the public API (see `AGENTS.md`).
5. **Follow existing patterns** — match the structure of existing `src/<module>/` modules (e.g. `src/cbor/`) for directory layout, test style, and barrel exports.
6. **Stop for human review at each phase boundary** — after a phase is left committable, stop and let the human review and commit before continuing to the next phase, unless explicitly instructed to continue.
