# Mobile Wallet mdoc Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A TypeScript library for building mdoc (ISO/IEC 18013-5) documents for use with GOV.UK Wallet. It
provides a type-safe API for constructing, signing, and encoding mdoc-based credentials, published as a
dual-format (ESM and CJS) npm package.

## What it does

- Validates a structured credential input and reports all problems at once as typed errors.
- Builds the ISO 18013-5 `IssuerSigned` structure: per-namespace `IssuerSignedItem`s with SHA-256
  value digests, the Mobile Security Object (MSO), and the `issuerAuth` COSE_Sign1.
- Embeds the holder's device public key (COSE_Key) and derives `keyAuthorizations` from your
  namespaces.
- Signs the MSO via a callback you provide, so your private key never enters the library.
- Returns the credential as bytes, hex, or base64url.

## What it does not do

- **It does not sign for you.** You pass a [`SigningFunction`](#signing); the library never holds a
  private key.
- **It does not manage keys or certificates.** You supply the SPKI device key and the DER certificate
  chain.
- **It only supports P-256 (ES256).** Other curves and algorithms are rejected.
- **It does not decode or verify mdocs.** This is a builder only.
- **It uses only the first certificate** in `certificateChain` at this time.

## Installation

```bash
npm install @govuk/mobile-wallet-mdoc-builder
```

Node.js 22 or later is required.

## Quick start

```ts
import { buildMdoc, DateFormat } from "@govuk/mobile-wallet-mdoc-builder";
import type {
  MdocBuilderInput,
  SigningFunction,
} from "@govuk/mobile-wallet-mdoc-builder";

const input: MdocBuilderInput = {
  documentType: "org.iso.18013.5.1.mDL",
  nameSpaces: new Map([
    [
      "org.iso.18013.5.1",
      [
        { elementIdentifier: "family_name", elementValue: "Doe" },
        { elementIdentifier: "given_name", elementValue: "Jane" },
        {
          elementIdentifier: "birth_date",
          elementValue: new Date("1990-01-01"),
          dateFormat: DateFormat.FullDate,
        },
      ],
    ],
  ]),
  deviceKey: spkiPublicKeyBytes, // Uint8Array, SPKI-encoded P-256 key
  credentialValidity: {
    validUntil: new Date("2030-01-01T00:00:00Z"),
  },
  statusList: { idx: 0, uri: "https://issuer.example/status/1" },
  certificateChain: [documentSignerCertDer], // Uint8Array[], DER-encoded
};

// You provide the signer; it receives the bytes to sign and returns a 64-byte P-256 signature.
const sign: SigningFunction = async (toBeSigned) => signWithYourKms(toBeSigned);

const mdoc = await buildMdoc(input, sign);

mdoc.asBase64Url(); // for an OID4VCI credential response
mdoc.asHex();
mdoc.asBytes();
```

## Supported element values and nesting

Each `DataElement` has an `elementIdentifier`, an `elementValue`, and an optional `dateFormat`. An
`elementValue` is a `DataElementValue`, which is one of:

- a **primitive**: `string`, `number`, `boolean`, `Date`, or `Uint8Array`;
- an **array of primitives**;
- a **`Map<string, primitive>`**; or
- an **array of such maps**.

Collections must be **homogeneous** — every value shares one primitive type — and are bounded in size.
Nesting is one level deep: arrays and maps hold primitives, not other arrays or maps. All strings must
be Latin-1 (ISO/IEC 8859-1). For the full set of limits and rules see
[`docs/validation-rules.md`](docs/validation-rules.md).

## Tagging of dates

`Date` values are CBOR-tagged according to the element's `dateFormat`:

- `DateFormat.FullDate` → **Tag 1004** (`full-date`, `YYYY-MM-DD`).
- `DateFormat.DateTime` → **Tag 0** (`tdate`, RFC 3339 UTC date-time).

`dateFormat` defaults to `DateTime` when omitted. It may only be set when the value is date-typed;
setting it on a non-date value is a validation error.

## Device key format

`deviceKey` is the holder's public key as **SPKI-encoded DER bytes** (`Uint8Array`). Only **ECDSA on the
P-256 curve** is supported at this time — any other key type or curve is rejected with an
`MdocBuilderError`. The library imports the key, builds the COSE_Key (EC2 / P-256, with `x` and `y`
zero-padded to 32 bytes), and derives `keyAuthorizations.nameSpaces` from the namespaces you provide.

## Validity info behaviour

`credentialValidity` maps to the ISO 18013-5 `ValidityInfo`. `signed` and `validFrom` are derived by the
library at build time; you cannot set them directly:

- **`signed`** — set to the current time when `buildMdoc` runs.
- **`validFrom`** — the later of your optional `earliestValidFrom` and `signed`. If
  `earliestValidFrom` is omitted or not after `signed`, `validFrom` equals `signed`.
- **`validUntil`** — required; passed through unchanged; must be in the future.
- **`expectedUpdate`** — optional; passed through unchanged.

## certificateChain

`certificateChain` is an array of **DER-encoded certificates** (`Uint8Array[]`). Only
`certificateChain[0]` — the document signing certificate — is used at this time, and it is placed in the
COSE unprotected header as `x5chain`.

## Signing

You provide a `SigningFunction`:

```ts
type SigningFunction = (toBeSigned: Uint8Array) => Promise<Uint8Array>;
```

The library calls it with the COSE `Sig_Structure` `toBeSigned` bytes and expects a **raw 64-byte P-256
signature** (`r || s`) in return. Pass those bytes straight to your signer with no extra hashing or
encoding.

## Error handling

All failures are thrown as [`MdocBuilderError`](src/types/mdocBuilderError.ts) — a typed `Error`
subclass. It is thrown when:

- **Input validation fails** — the error carries a `violations` array of `{ field, message }` entries
  describing every problem found (validation collects all issues, it does not stop at the first).
- **The device key cannot be used** — the SPKI bytes fail to import, or the key is not EC / not P-256.
- **Signing fails** — your `SigningFunction` throws (wrapped with `cause`), returns a non-`Uint8Array`,
  or returns a signature that is not 64 bytes.

```ts
import { MdocBuilderError } from "@govuk/mobile-wallet-mdoc-builder";

try {
  await buildMdoc(input, sign);
} catch (error) {
  if (error instanceof MdocBuilderError) {
    console.error(error.message);
    for (const violation of error.violations ?? []) {
      console.error(`${violation.field}: ${violation.message}`);
    }
  }
}
```

## Documentation

- [Component architecture](docs/component-architecture.md) — how `buildMdoc` composes its internal
  components.
- [Validation rules](docs/validation-rules.md) — the complete input validation reference.
- [Contributing](docs/contributing.md) — how to set up and contribute.
- [CBOR test guide](docs/cbor-test-guide.md) — maintainer reference for byte-exact encoding tests.

## Release process

Releases are created using the [release workflow](.github/workflows/release.yml), triggered manually via
GitHub Actions `workflow_dispatch`. When triggered from `main`, the workflow:

1. Runs code quality and security analysis (SonarQube).
2. Runs type checking, linting, and formatting checks.
3. Runs build and component tests.
4. Validates conventional commits.
5. Creates a semantic version tag using [cocogitto](https://docs.cocogitto.io/) from the conventional
   commit history.
6. Pushes the tag and creates a GitHub release with auto-generated notes.

The version is determined from commit messages following
[Conventional Commits](https://www.conventionalcommits.org/) — `fix:` bumps the patch version, `feat:`
the minor version, and a breaking change the major version.

### Known limitations

1. **package.json version is not updated** — the semantic version tag is created but `package.json` is
   not bumped to match. This will come in a future iteration.
2. **No publish to a registry** — the release does not publish to npm or any other registry. This will
   come in a future release.
3. **Manual trigger only** — the release workflow must be triggered by a human via the GitHub Actions
   UI.

## Contributing

See [`docs/contributing.md`](docs/contributing.md).

## Licence

[MIT License](LICENSE)
