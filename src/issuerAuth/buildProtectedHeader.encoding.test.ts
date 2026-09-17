import { describe, expect, it } from "vitest";

// Uses the REAL cbor encoder (src/cbor is NOT mocked) to verify byte-exact output.
const { buildProtectedHeader } = await import("./buildProtectedHeader.js");

describe("buildProtectedHeader byte-level encoding", () => {
  it("produces spec-correct bytes for { 1: -7 } (alg = ES256)", () => {
    // Expected bytes derived from cbor.me:
    //   {1: -7}
    // = A1 (map, 1 pair)
    //   01 (unsigned 1  -> alg label)
    //   26 (negative -7 -> ES256)
    const expected = new Uint8Array([0xa1, 0x01, 0x26]);

    const result = buildProtectedHeader();

    expect(result).toEqual(expected);
  });
});
