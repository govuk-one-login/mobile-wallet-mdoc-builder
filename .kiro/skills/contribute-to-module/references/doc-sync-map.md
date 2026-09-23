# Documentation Sync Map

Documentation travels with code: a change is not finished until the docs it affects match. When a phase
makes one of the changes below, update the corresponding documentation in the same phase, before
proposing the commit.

| When you change...                                                 | Update...                                                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| A validation rule, limit, or message (`src/validation/`)           | [`docs/validation-rules.md`](../../../../docs/validation-rules.md) — the master validation reference. |
| A public export or type (anything re-exported from `src/index.ts`) | The exported symbol's TSDoc **and** [`README.md`](../../../../README.md).                             |
| The `buildMdoc` orchestration or a component's role                | [`docs/component-architecture.md`](../../../../docs/component-architecture.md) — diagram and prose.   |
| The CBOR encoder or its tag support (`src/cbor/`)                  | [`docs/cbor-test-guide.md`](../../../../docs/cbor-test-guide.md) if byte-level behaviour changed.     |

Notes:

- The code is always the ultimate source of truth; docs describe it, they do not lead it.
- `docs/validation-rules.md` is the single master copy of validation rules — do not duplicate its
  tables elsewhere; summarise and link instead.
- If a change touches none of the above, no doc update is required — say so explicitly rather than
  guessing.
