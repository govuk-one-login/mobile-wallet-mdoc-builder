# Mobile Wallet mdoc Builder Documentation

## Component Architecture Diagram

This diagram shows the internal architecture of the mdoc builder library. It maps the components that make up the library, how data flows between them, and how the CBOR abstraction layer underpins encoding
across the system. The public API surface is `buildMdoc`, which orchestrates all internal components to produce a signed mdoc credential.

```mermaid
graph TD
    %% Public API surface
    subgraph Public["Public API"]
        buildMdoc["buildMdoc(input, sign)"]
        MdocOutput["Mdoc Output\n.asBase64Url() / .asHex() / .asBytes()"]
    end

    %% Internal components
    subgraph Validation["Input Validation"]
        Validator["Validation Function\n(collects all errors)"]
    end

    subgraph DeviceKey["Device Key Handling"]
        SPKIImport["SPKI Import\n(Web Crypto API)"]
        COSEKey["COSE_Key Construction\n(P-256: kty, crv, x, y)"]
        KeyAuth["keyAuthorizations\n(derived from namespace names)"]
    end

    subgraph CredentialValidity["Credential Validity"]
        ValidityResolver["ValidityInfo Resolver\n(signed, validFrom, validUntil, expectedUpdate)"]
    end

    subgraph IssuerSignedItems["IssuerSignedItem Construction"]
        ItemBuilder["IssuerSignedItem Builder\n(digestID, random salt, element)"]
        DigestCompute["SHA-256 Digest Computation\n(over Tag 24 encoded bytes)"]
        ValueDigests["valueDigests Map\n(namespace → digestID → digest)"]
    end

    subgraph MSOConstruction["MSO Construction"]
        MSOBuilder["MSO Builder\n(version, digestAlgorithm, valueDigests,\ndeviceKeyInfo, validityInfo, status, docType)"]
    end

    subgraph Signing["Signing"]
        ProtectedHeader["Protected Header\n(alg: ES256)"]
        SigStructure["Sig_Structure\n(Signature1, protected, empty AAD, MSO)"]
        ToBeSigned["toBeSigned bytes"]
        SignCallback["Caller's SigningFunction"]
        IssuerAuth["issuerAuth / COSE_Sign1\n(protected, unprotected{x5chain}, MSO, signature)"]
    end

    subgraph Assembly["IssuerSigned Assembly"]
        IssuerSigned["IssuerSigned\n(nameSpaces + issuerAuth)\nCBOR-encoded"]
    end

    subgraph CBOR["CBOR Abstraction Layer"]
        Encoder["CBOR Encoder\n(deterministic, definite-length)"]
        Tag0["Tag 0 — tdate"]
        Tag1004["Tag 1004 — full-date"]
        Tag24["Tag 24 — embedded CBOR"]
    end

    %% Flow
    buildMdoc --> Validator
    Validator -->|valid input| SPKIImport
    Validator -->|valid input| ItemBuilder
    Validator -->|valid input| ValidityResolver

    SPKIImport --> COSEKey
    COSEKey --> KeyAuth

    ItemBuilder --> DigestCompute
    DigestCompute --> ValueDigests

    KeyAuth --> MSOBuilder
    ValueDigests --> MSOBuilder
    ValidityResolver --> MSOBuilder

    MSOBuilder --> ProtectedHeader
    MSOBuilder --> SigStructure
    ProtectedHeader --> SigStructure
    SigStructure --> ToBeSigned
    ToBeSigned --> SignCallback
    SignCallback --> IssuerAuth
    ProtectedHeader --> IssuerAuth

    IssuerAuth --> IssuerSigned
    ItemBuilder --> IssuerSigned

    IssuerSigned --> MdocOutput

    %% CBOR used by multiple components
    Encoder -.->|encodes| ItemBuilder
    Encoder -.->|encodes| MSOBuilder
    Encoder -.->|encodes| SigStructure
    Encoder -.->|encodes| IssuerSigned
    Tag0 -.-> ValidityResolver
    Tag0 -.-> ItemBuilder
    Tag1004 -.-> ItemBuilder
    Tag24 -.-> ItemBuilder

    %% Styling — high contrast, no red/green, readable on light and dark
    classDef public fill:#1e88e5,stroke:#1565c0,color:#ffffff,stroke-width:2px
    classDef validation fill:#f9a825,stroke:#f57f17,color:#000000
    classDef core fill:#00838f,stroke:#006064,color:#ffffff
    classDef signing fill:#e65100,stroke:#bf360c,color:#ffffff
    classDef cbor fill:#7b1fa2,stroke:#4a148c,color:#ffffff
    classDef output fill:#1e88e5,stroke:#1565c0,color:#ffffff,stroke-width:2px

    class buildMdoc,MdocOutput public
    class Validator validation
    class SPKIImport,COSEKey,KeyAuth,ValidityResolver,ItemBuilder,DigestCompute,ValueDigests,MSOBuilder core
    class ProtectedHeader,SigStructure,ToBeSigned,SignCallback,IssuerAuth signing
    class Encoder,Tag0,Tag1004,Tag24 cbor
    class IssuerSigned output
```

## Legend

| Colour | Layer                  |
| ------ | ---------------------- |
| Blue   | Public API             |
| Yellow | Input Validation       |
| Teal   | Core Domain Logic      |
| Orange | Signing Pipeline       |
| Purple | CBOR Abstraction Layer |

## Component Summary

| Component                            | Responsibility                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| **buildMdoc**                        | Public entry point — orchestrates all internal components                           |
| **Input Validation**                 | Validates `MdocBuilderInput`, collects all errors before returning                  |
| **Device Key Handling**              | Imports SPKI key via Web Crypto, builds COSE_Key (P-256), derives keyAuthorizations |
| **Credential Validity**              | Resolves `signed`, `validFrom`, `validUntil`, `expectedUpdate` at construction time |
| **IssuerSignedItem Construction**    | Wraps each data element with digestID + random salt, computes SHA-256 digests       |
| **MSO Construction**                 | Assembles the Mobile Security Object with all metadata and digests                  |
| **Protected Header & Sig_Structure** | Builds COSE Sig_Structure to produce `toBeSigned` bytes                             |
| **Signing Callback**                 | Passes `toBeSigned` to caller's function, assembles COSE_Sign1 (issuerAuth)         |
| **IssuerSigned Assembly**            | Combines encoded namespace items + issuerAuth into final CBOR payload               |
| **Mdoc Output**                      | Wraps raw bytes, exposes `.asBase64Url()`, `.asHex()`, `.asBytes()`                 |
| **CBOR Abstraction Layer**           | Deterministic encoding, Tag 0/1004/24 support — isolates cbor2 dependency           |
