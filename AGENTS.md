# AGENTS.md

Guidance for coding agents working in this repository.

## Project

A TypeScript library for building mdoc (ISO 18013-5) documents for use with GOV.UK Wallet, published as a
dual-format (ESM/CJS) npm package. Public entry point is `buildMdoc(input, sign)` in `src/index.ts`, which
orchestrates validation, device key handling, credential validity, IssuerSignedItem construction, MSO
construction, signing, and final assembly. See `docs/component-architecture.md` for the full component diagram.

The library is early-stage: `buildMdoc` currently throws `MdocBuilderError("not implemented")`. This is
expected scaffolding, not a bug — components are being built incrementally.

## Commands

```bash
npm install               # setup — Node 22 required
npm run lint              # eslint
npm run format            # prettier --write
npm run format:check      # prettier --check
npm run typecheck         # tsc --noEmit
npm run build             # tsdown -> dist/
npm test                  # vitest run --coverage (unit tests, src/**/*.test.ts)
npm run test:component    # builds first, then runs tests/component (ESM + CJS) against dist/
```

`test:component` exercises the built `dist/` output, not source — always rebuild before running it if source
changed.

## Development workflow

### TDD and commits

- **TDD is mandatory.** Tests are written before implementation, in small phases, each independently
  testable and committed separately.
- **Linting and formating.** Code that is implemented should comply with the project ESLint and Prettier checks.
- **Conventional Commits** are enforced by a pre-commit `commit-msg` hook — non-conforming messages are
  rejected. Don't bypass with `--no-verify`.
- Pre-commit runs eslint, prettier, and typecheck on `pre-commit`, and the full test suite on
  `pre-push`. Don't bypass with `--no-verify`.
- Coverage is expected to stay effectively 100% for new modules — write tests for every branch, including
  error paths.

### Module structure

Every module follows the `src/cbor/` pattern:

```
src/<module>/
├── index.ts                       # barrel export — public API of the module
├── <file>.ts                      # implementation file(s)
├── <file>.test.ts                 # co-located unit test, named to match source file
├── <file>.encoding.test.ts        # co-located cbor encoding test, use the real cbor module
└── helpers/                       # follow the same structure of code and unit tests
    ├── <file>.ts
    └── <file>.test.ts
```

- Each module has a barrel `index.ts` that defines its public API.
- Unit tests are co-located with source: `foo.ts` → `foo.test.ts`.
- `tests/` is for public interface, integration, and component tests — not unit tests.
- Test files follow the source file name, not the module name.

### Testing strategy for CBOR-producing modules

Modules that encode CBOR output (IssuerSignedItem, MSO, Sig_Structure, IssuerSigned assembly) use a
two-layer testing approach:

1. **Unit tests (`<file>.test.ts`)** — mock the `src/cbor/` barrel to test logic and delegation in
   isolation. Verify correct arguments are passed to `encode`, `tdate`, `fullDate`, `embeddedCbor` without
   depending on the encoder's byte output. This is the primary test layer covering all branches.

2. **Encoding tests (`<file>.encoding.test.ts`)** — use the **real** CBOR encoder with deterministic
   (mocked) randomness to verify byte-exact output. Expected bytes are derived from https://cbor.me using
   CBOR diagnostic notation (see `docs/cbor-test-guide.md`). These are co-located alongside the unit tests
   and catch encoding regressions that mocked tests cannot.

Both file types are co-located with source and run as part of `npm test`. The `.encoding.test.ts` convention
signals the test uses the real encoder — it is not a separate test tier or runner.

### Dependencies

- New external dependencies must be wrapped behind an internal module (as `cbor2` is wrapped by `src/cbor/`).
  No third-party types should leak beyond the wrapping module's barrel.

## Architecture boundaries

Modules are self-contained with a defined interface via the barrel export. Consumers import from the barrel
only — never from internal files. Examples:

- `src/cbor/` wraps the `cbor2` dependency and is the **only** place `cbor2` may be imported. Its barrel
  (`src/cbor/index.ts`) exposes exactly `encode`, `tdate`, `fullDate`, `embeddedCbor`, and the `TaggedValue`
  type — no `cbor2` types may leak beyond this module. See `docs/cbor-test-guide.md` when adding CBOR
  byte-level tests (use https://cbor.me to derive expected bytes from diagnostic notation).
- `src/types/` holds the public type surface (`MdocBuilderInput`, `Mdoc`, `DataElement`, etc.) — these are
  re-exported from `src/index.ts` and form the package's public API contract.

## Spec-driven design decisions

- **No map key sorting** — ISO 18013-5 §9.1.2.4 — insertion order preserved by `cbor2`; callers control order. Don't add key-sorting logic.

## Where to look first

- `docs/component-architecture.md` — component diagram and responsibilities.
- `README.md` — release process and contributing setup.
