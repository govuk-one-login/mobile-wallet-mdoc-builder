# Key Rules for Phase Design

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
