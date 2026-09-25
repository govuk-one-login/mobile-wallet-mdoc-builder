# Contributing

The human starting point for contributing to the mdoc builder library. It does **not** restate the
rules coding agents follow — those live in [`AGENTS.md`](../AGENTS.md), the single source of truth for
module structure, the TDD cycle, testing strategy, commit conventions, and architecture boundaries.

## Set up

- **Node 22** — pinned in [`.nvmrc`](../.nvmrc); run `nvm use`.
- **Install** — `npm install`.
- **pre-commit hooks** — install [`pre-commit`](https://pre-commit.com/) and enable them:

  ```bash
  pre-commit install --hook-type pre-commit --hook-type commit-msg
  ```

The hooks run lint, format, and typecheck on commit, the test suite on push, and validate the commit
message. `npm run verify` runs the same lint/format/typecheck/test gate in one command — run it before
you push.

## How we work

- **Test-driven, in small phases** — tests first, small reviewable increments.
- **Conventional Commits** — enforced by a hook; they drive automated versioning (`fix:` → patch,
  `feat:` → minor, breaking → major).
- **Docs travel with code** — a validation change updates
  [`docs/validation-rules.md`](./validation-rules.md); a public API or type change updates the README
  and the exported symbols' TSDoc.

## Implementing changes with agent skills

To implement code, use the agent skills under [`.kiro/skills/`](../.kiro/skills/) rather than working
freehand — they encode the conventions and doc-sync obligations above. Skills are **task-atomic**: one
per repeatable multi-step workflow, not one per file or rule.

- **`plan-mdoc-core-build`** — turns a ticket into a phased approach document under `context/`.
- **`contribute-to-module`** — implements that approach document phase by phase. It expects a plan to
  already exist.

Plan first, then build: run `plan-mdoc-core-build`, then hand the approach document to
`contribute-to-module`.

## Reference

- [`AGENTS.md`](../AGENTS.md) — canonical conventions.
- [`docs/component-architecture.md`](./component-architecture.md) — how `buildMdoc` composes its
  components.
- [`docs/validation-rules.md`](./validation-rules.md) — master input-validation reference.
- [`docs/cbor-test-guide.md`](./cbor-test-guide.md) — byte-exact CBOR encoding test reference.
