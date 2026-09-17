import { describe, expect, it } from "vitest";
import { assembleIssuerSigned } from "./assembleIssuerSigned.js";
import type { IssuerAuth } from "../issuerAuth";
import { hexToBytes } from "../test-helpers/hexToBytes.js";

/**
 * A deterministic IssuerAuth (COSE_Sign1) fixture. The byte contents are
 * arbitrary but fixed; the signature is shortened to 8 bytes since encoding
 * correctness does not depend on its length.
 */
function makeIssuerAuth(): IssuerAuth {
  return [
    new Uint8Array([0xa1, 0x01, 0x26]), // protected header: {1: -7} (ES256)
    new Map<number, Uint8Array>([[33, new Uint8Array([0xde, 0xad])]]), // {33: x5chain}
    new Uint8Array([0xd8, 0x18, 0x41, 0x00]), // MSO bytes (Tag 24)
    new Uint8Array([0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11]), // signature
  ];
}

describe("assembleIssuerSigned byte-level encoding", () => {
  it("produces spec-correct IssuerSigned bytes with items verbatim as Tag 24", () => {
    const nameSpaces = new Map<string, Uint8Array[]>([
      ["ns", [new Uint8Array([0x01]), new Uint8Array([0x02, 0x03])]],
      ["n2", [new Uint8Array([0x04])]],
    ]);

    const result = assembleIssuerSigned(nameSpaces, makeIssuerAuth());

    // Expected bytes derived from https://cbor.me (see docs/cbor-test-guide.md).
    const expected = hexToBytes(
      "A2" +
        "6A6E616D65537061636573" +
        "A2" +
        "626E73" +
        "82" +
        "D8184101" +
        "D818420203" +
        "626E32" +
        "81" +
        "D8184104" +
        "6A69737375657241757468" +
        "84" +
        "43A10126" +
        "A1182142DEAD" +
        "44D8184100" +
        "481111111111111111",
    );

    expect(result).toEqual(expected);
  });

  it("preserves namespace insertion order in the encoded output", () => {
    const forward = assembleIssuerSigned(
      new Map<string, Uint8Array[]>([
        ["ns", [new Uint8Array([0x01])]],
        ["n2", [new Uint8Array([0x04])]],
      ]),
      makeIssuerAuth(),
    );
    const reversed = assembleIssuerSigned(
      new Map<string, Uint8Array[]>([
        ["n2", [new Uint8Array([0x04])]],
        ["ns", [new Uint8Array([0x01])]],
      ]),
      makeIssuerAuth(),
    );

    // No key sorting — ISO 18013-5 §9.1.2.4; the two orders encode differently.
    expect(forward).not.toEqual(reversed);
  });

  it("encodes an empty-item namespace as an empty array", () => {
    const result = assembleIssuerSigned(
      new Map<string, Uint8Array[]>([["ns", []]]),
      makeIssuerAuth(),
    );

    // "nameSpaces": {"ns": []} -> A1 626E73 80 ; then "issuerAuth": [...]
    const expected = hexToBytes(
      "A2" +
        "6A6E616D65537061636573" +
        "A1" +
        "626E73" +
        "80" +
        "6A69737375657241757468" +
        "84" +
        "43A10126" +
        "A1182142DEAD" +
        "44D8184100" +
        "481111111111111111",
    );

    expect(result).toEqual(expected);
  });

  it("returns a Uint8Array beginning with the IssuerSigned map header (A2)", () => {
    const result = assembleIssuerSigned(
      new Map<string, Uint8Array[]>([["ns", [new Uint8Array([0x01])]]]),
      makeIssuerAuth(),
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result[0]).toBe(0xa2); // map with 2 entries
  });
});
