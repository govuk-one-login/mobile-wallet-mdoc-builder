# mdoc Builder Input Validation Rules

Reference for how `MdocBuilderInput` is validated before an mdoc is built. All values and messages
here are transcribed from `src/validation/`.

## Overview

Validation is performed by `validateMdocBuilderInput(input: unknown): ValidationError[]`, exported
from the `src/validation/` barrel. Its contract is:

- **Returns an array, never throws.** A `ValidationError[]` is returned; an **empty array means the
  input is valid**.
- **Collects all violations.** The input is checked with a single `safeParse` and every issue is
  mapped to a `ValidationError` — there is no early return on the first failure.
- **`buildMdoc` owns throwing.** This function only reports; the caller (`buildMdoc`) decides how to
  surface the errors.
- **Clock is injected at call time.** The schema is built with a fresh `new Date()` on each call, so
  time-based rules (`credentialValidity`) are evaluated against "now".

---

## The `ValidationError` shape

Each violation is a plain object (`src/validation/errors.ts`):

```ts
interface ValidationError {
  field: string;
  message: string;
}
```

### Field-path notation

`field` is a path built by `formatFieldPath`: string keys are joined with `.`, and numeric indices
are appended as `[n]`.

| Example field                     | Refers to                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| `documentType`                    | The top-level `documentType`                                     |
| `nameSpaces.<ns>[0].elementValue` | The `elementValue` of the first data element in namespace `<ns>` |
| `statusList.uri`                  | The `uri` field of `statusList`                                  |
| `certificateChain[0]`             | The first entry of `certificateChain`                            |

> The top-level input object and `statusList` are validated with `.strict()`. Unknown keys produce
> `unrecognized_keys` issues, which are expanded to **one `ValidationError` per unknown key** (the
> key is appended to the path).

---

## Validation rules

Each table lists the constraint, the rule, the limit (referencing `VALIDATION_LIMITS` in
`src/validation/constants.ts`), and the error message. Messages marked _(Zod default)_ are produced
by Zod's built-in validators and are not custom text.

### documentType

A non-empty string identifying the document type (e.g. `"org.iso.18013.5.1.mDL"`).

| Constraint | Rule            | Limit                                            | Error message   |
| ---------- | --------------- | ------------------------------------------------ | --------------- |
| Type       | Must be string  | —                                                | _(Zod default)_ |
| Min length | ≥ 1 (non-empty) | `VALIDATION_LIMITS.documentType.minLength` = 1   | _(Zod default)_ |
| Max length | ≤ 128           | `VALIDATION_LIMITS.documentType.maxLength` = 128 | _(Zod default)_ |

### nameSpaces

A `Map<string, DataElement[]>` of namespace identifiers to their data elements.

| Constraint         | Rule                         | Limit                                                       | Error message       |
| ------------------ | ---------------------------- | ----------------------------------------------------------- | ------------------- |
| Map non-empty      | Must contain ≥ 1 namespace   | —                                                           | `must not be empty` |
| Namespace key      | Non-empty string             | `VALIDATION_LIMITS.nameSpaces.namespaceKey.minLength` = 1   | _(Zod default)_     |
| Namespace key      | Max length ≤ 256             | `VALIDATION_LIMITS.nameSpaces.namespaceKey.maxLength` = 256 | _(Zod default)_     |
| Data-element count | ≥ 1 element per namespace    | `VALIDATION_LIMITS.nameSpaces.minDataElements` = 1          | _(Zod default)_     |
| Data-element count | ≤ 256 elements per namespace | `VALIDATION_LIMITS.nameSpaces.maxDataElements` = 256        | _(Zod default)_     |

Each entry in a namespace's array is a `DataElement` with `elementIdentifier`, `elementValue`, and
an optional `dateFormat`.

#### elementIdentifier

| Constraint | Rule            | Limit                                                            | Error message   |
| ---------- | --------------- | ---------------------------------------------------------------- | --------------- |
| Type       | Must be string  | —                                                                | _(Zod default)_ |
| Min length | ≥ 1 (non-empty) | `VALIDATION_LIMITS.nameSpaces.elementIdentifier.minLength` = 1   | _(Zod default)_ |
| Max length | ≤ 256           | `VALIDATION_LIMITS.nameSpaces.elementIdentifier.maxLength` = 256 | _(Zod default)_ |

#### elementValue

`elementValue` is a `DataElementValue`: a single primitive, an array of primitives, a
`Map<string, primitive>`, or an array of such maps. The permitted primitive types are `string`,
`number`, `boolean`, `Date`, and `Uint8Array`.

**Primitive scalars** (`src/validation/primitives.ts`):

| Constraint     | Rule                        | Limit                                                               | Error message                   |
| -------------- | --------------------------- | ------------------------------------------------------------------- | ------------------------------- |
| string min     | ≥ 1 (non-empty)             | `VALIDATION_LIMITS.elementValue.string.minLength` = 1               | _(Zod default)_                 |
| string max     | ≤ 150                       | `VALIDATION_LIMITS.elementValue.string.maxLength` = 150             | _(Zod default)_                 |
| number min     | ≥ `Number.MIN_SAFE_INTEGER` | `VALIDATION_LIMITS.elementValue.number.min` = -9007199254740991     | _(Zod default)_                 |
| number max     | ≤ `Number.MAX_SAFE_INTEGER` | `VALIDATION_LIMITS.elementValue.number.max` = 9007199254740991      | _(Zod default)_                 |
| boolean        | Must be boolean             | —                                                                   | _(Zod default)_                 |
| Date           | Must be a `Date`            | —                                                                   | _(Zod default)_                 |
| Uint8Array min | ≥ 1 byte (non-empty)        | `VALIDATION_LIMITS.elementValue.uint8Array.minByteLength` = 1       | `must not be empty`             |
| Uint8Array max | ≤ 1,572,864 bytes (1.5 MB)  | `VALIDATION_LIMITS.elementValue.uint8Array.maxByteLength` = 1572864 | `must not exceed 1572864 bytes` |

> The `number` schema is `z.number().min(min).max(max)` only. `NaN` is rejected by `z.number()`
> itself, and `Infinity` fails the `.max` bound — there is no separate NaN/Infinity refinement in
> the code. See the maintainers section.

**Collections** (`src/validation/dataElementValue.ts`). Arrays, maps, and arrays-of-maps must be
non-empty and bounded, and must be **homogeneous** (see
[Homogeneity and date-typing](#homogeneity-and-date-typing)):

| Constraint                  | Rule                                       | Limit                                           | Error message                                |
| --------------------------- | ------------------------------------------ | ----------------------------------------------- | -------------------------------------------- |
| Primitive array min         | ≥ 1 (non-empty)                            | `VALIDATION_LIMITS.collections.minLength` = 1   | _(Zod default)_                              |
| Primitive array max         | ≤ 256                                      | `VALIDATION_LIMITS.collections.maxLength` = 256 | _(Zod default)_                              |
| Primitive array homogeneity | All values same primitive type             | —                                               | `all values must be the same primitive type` |
| Map min size                | ≥ 1 entry (non-empty)                      | `VALIDATION_LIMITS.collections.minLength` = 1   | `must not be empty`                          |
| Map max size                | ≤ 256 entries                              | `VALIDATION_LIMITS.collections.maxLength` = 256 | `must not exceed 256 entries`                |
| Map homogeneity             | All values same primitive type             | —                                               | `all values must be the same primitive type` |
| Array-of-maps min           | ≥ 1 map (non-empty)                        | `VALIDATION_LIMITS.collections.minLength` = 1   | _(Zod default)_                              |
| Array-of-maps max           | ≤ 256 maps                                 | `VALIDATION_LIMITS.collections.maxLength` = 256 | _(Zod default)_                              |
| Array-of-maps: each map     | Each map non-empty                         | `VALIDATION_LIMITS.collections.minLength` = 1   | `each map must not be empty`                 |
| Array-of-maps: each map     | Each map ≤ 256 entries                     | `VALIDATION_LIMITS.collections.maxLength` = 256 | `each map must not exceed 256 entries`       |
| Array-of-maps homogeneity   | Uniform primitive type across **all** maps | —                                               | `all values must be the same primitive type` |

#### dateFormat

`dateFormat` (`DateFormat.FullDate = 0`, `DateFormat.DateTime = 1`) is an optional per-element hint
(`src/validation/nameSpaces.ts`).

| Constraint          | Rule                                                      | Error message                                                         |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| Value type          | Must be a `DateFormat` enum member when present           | _(Zod default)_                                                       |
| When date-typed     | Optional; permitted (defaults to `DateTime` when omitted) | —                                                                     |
| When not date-typed | Forbidden                                                 | `dateFormat must not be provided when elementValue is not date-typed` |

### deviceKey

The SPKI-encoded holder public key, as a `Uint8Array` (`src/validation/topLevelCredentialFields.ts`).

| Constraint | Rule                 | Limit                                              | Error message                |
| ---------- | -------------------- | -------------------------------------------------- | ---------------------------- |
| Type       | Must be `Uint8Array` | —                                                  | _(Zod default)_              |
| Min bytes  | ≥ 1 (non-empty)      | `VALIDATION_LIMITS.deviceKey.minByteLength` = 1    | `must not be empty`          |
| Max bytes  | ≤ 2,048 bytes (2 KB) | `VALIDATION_LIMITS.deviceKey.maxByteLength` = 2048 | `must not exceed 2048 bytes` |

### credentialValidity

Maps to the ISO 18013-5 `ValidityInfo` structure. Cross-field rules are evaluated against the
injected clock (`now`) captured when `validateMdocBuilderInput` is called
(`src/validation/credentialValidity.ts`).

| Constraint          | Rule                                                  | Error message                           |
| ------------------- | ----------------------------------------------------- | --------------------------------------- |
| `validUntil`        | Required; must be a `Date`                            | _(Zod default)_                         |
| `validUntil`        | Must be strictly after `now`                          | `must be after the current time`        |
| `earliestValidFrom` | Optional; when present, must be a `Date`              | _(Zod default)_                         |
| `earliestValidFrom` | When present, must be strictly before `validUntil`    | `must be before validUntil`             |
| `expectedUpdate`    | Optional; when present, must be a `Date`              | _(Zod default)_                         |
| `expectedUpdate`    | When present, must be before or equal to `validUntil` | `must be before or equal to validUntil` |

### statusList

A reference to a status-list entry, validated with `.strict()`
(`src/validation/topLevelCredentialFields.ts`).

| Constraint   | Rule                         | Limit                                               | Error message                        |
| ------------ | ---------------------------- | --------------------------------------------------- | ------------------------------------ |
| `idx` type   | Integer                      | —                                                   | _(Zod default)_                      |
| `idx` min    | ≥ 0                          | `VALIDATION_LIMITS.statusList.idx.min` = 0          | _(Zod default)_                      |
| `idx` max    | ≤ 4,294,967,295 (uint32 max) | `VALIDATION_LIMITS.statusList.idx.max` = 4294967295 | _(Zod default)_                      |
| `uri`        | Must be a valid URL          | —                                                   | _(Zod default)_                      |
| `uri` max    | ≤ 2,048 characters           | `VALIDATION_LIMITS.statusList.uri.maxLength` = 2048 | _(Zod default)_                      |
| Unknown keys | Rejected (`.strict()`)       | —                                                   | _(Zod default, `unrecognized_keys`)_ |

### certificateChain

An array of DER-encoded certificates; `certificateChain[0]` is used as the document signing
certificate (`src/validation/topLevelCredentialFields.ts`).

| Constraint      | Rule                    | Limit                                                           | Error message                |
| --------------- | ----------------------- | --------------------------------------------------------------- | ---------------------------- |
| Array min       | ≥ 1 entry (non-empty)   | `VALIDATION_LIMITS.certificateChain.minLength` = 1              | _(Zod default)_              |
| Entry type      | Each entry `Uint8Array` | —                                                               | _(Zod default)_              |
| Entry min bytes | ≥ 1 (non-empty)         | `VALIDATION_LIMITS.certificateChain.entry.minByteLength` = 1    | `must not be empty`          |
| Entry max bytes | ≤ 8,192 bytes (8 KB)    | `VALIDATION_LIMITS.certificateChain.entry.maxByteLength` = 8192 | `must not exceed 8192 bytes` |

---

## Homogeneity and date-typing

Collections must be **homogeneous** — every value shares a single primitive type (`string`,
`number`, `boolean`, `date`, or `uint8Array`). For an **array of maps**, homogeneity is checked
across **all maps' values flattened together**: every value of every map must share one primitive
type, not merely within each map individually.

Because homogeneity forces a collection to a single primitive type, **date-typing is
all-or-nothing**. A value is _date-typed_ (`isDateTyped`) when it is:

- a `Date`; or
- a `Map` with any `Date` value; or
- an `Array` that (recursively) contains a `Date`.

A `Date` anywhere in the value therefore means the whole value is date-typed. This is why the
`dateFormat` rule is a plain type test with no partial/mixed-date reasoning: `dateFormat` is
permitted only when the value is date-typed, and forbidden otherwise.

---

## Source of truth (maintainers)

- `src/validation/constants.ts` (the `VALIDATION_LIMITS` object) and the Zod schemas in
  `src/validation/` are the **authoritative** source of truth for all limits and messages.
- `context/validation_rules.json` is the **agreed rule record** — useful for intent and wording, but
  it is gitignored working notes and is **not** authoritative over the code.

### Native Zod vs custom refinements

Some rules are enforced by native Zod validators; others are custom `.refine` / `.superRefine`
checks with the messages quoted above.

| Rule                                                                    | Kind                              |
| ----------------------------------------------------------------------- | --------------------------------- |
| string / number min–max                                                 | Native Zod                        |
| identifier and namespace-key length                                     | Native Zod                        |
| `z.boolean()`, `z.date()`, `z.instanceof(Uint8Array)`                   | Native Zod                        |
| `z.url()` (uri), `.int()` / min / max on `idx`                          | Native Zod                        |
| array `.min` / `.max` (element counts, chain, collections)              | Native Zod                        |
| `z.enum(DateFormat)`                                                    | Native Zod                        |
| `.strict()` unknown-key rejection (`unrecognized_keys`)                 | Native Zod                        |
| Uint8Array byte-length bounds (device key, cert entries, element value) | Custom refinement                 |
| Homogeneity (array, map, array-of-maps)                                 | Custom refinement                 |
| Map size bounds (min/max entries)                                       | Custom refinement                 |
| `dateFormat` cross-field rule                                           | Custom refinement (`superRefine`) |
| `credentialValidity` cross-field rules                                  | Custom refinement (`superRefine`) |

> **NaN / Infinity note.** `numberValueSchema` is `z.number().min(min).max(max)` with no explicit
> NaN/Infinity refinement. `NaN` is rejected by `z.number()` itself, and `Infinity` is rejected by
> the `.max` bound. `context/validation_rules.json` lists `disallowNaN` / `disallowInfinity` as
> intent; the code achieves both without a dedicated refinement.
