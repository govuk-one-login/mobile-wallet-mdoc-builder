# Module Structure Checklist

The authoritative rules are in [`AGENTS.md`](../../../../AGENTS.md#module-structure). This checklist is
a quick working reminder while implementing a phase.

Every module follows the `src/cbor/` pattern:

```
src/<module>/
├── index.ts                 # barrel export — the module's public API
├── <file>.ts                # implementation
├── <file>.test.ts           # co-located unit test, named to match the source file
├── <file>.encoding.test.ts  # byte-exact CBOR test (only for CBOR-producing modules)
└── helpers/                 # same code + unit-test structure
```

When adding or changing a module, confirm:

- [ ] The barrel `index.ts` exposes only the intended public API — no internal or third-party types
      leak.
- [ ] Each source file has a co-located `<file>.test.ts` named after the file, not the module.
- [ ] CBOR-producing modules also have a `<file>.encoding.test.ts` using the real encoder — see
      [`docs/cbor-test-guide.md`](../../../../docs/cbor-test-guide.md).
- [ ] Unit tests are co-located under `src/`; only public-interface, integration, and component tests
      live under `tests/`.
- [ ] New external dependencies are wrapped behind an internal module (as `cbor2` is wrapped by
      `src/cbor/`).
- [ ] Coverage stays effectively 100%, including error paths.
