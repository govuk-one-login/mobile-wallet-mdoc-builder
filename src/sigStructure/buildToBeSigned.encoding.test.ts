import { describe, expect, it } from "vitest";
// Real cbor encoder used — do NOT mock src/cbor
import { buildToBeSigned } from "./buildToBeSigned.js";

/**
 * Helper to convert a hex string to a Uint8Array.
 */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

describe("buildToBeSigned byte-level smoke tests", () => {
  it("produces spec-correct Sig_Structure bytes (RFC 9052 §4.4)", () => {
    // protected header: {1: -7} (ES256) = h'A10126'
    const protectedHeader = hexToBytes("A1 01 26");
    // tag 24 wrapped MSO bytes: 24(h'00') = h'D8184100'
    const msoBytes = hexToBytes("D8 18 41 00");

    const result = buildToBeSigned(protectedHeader, msoBytes);

    // Expected bytes derived from cbor.me:
    // ["Signature1", h'A10126', h'', h'D8184100']
    // = 84
    //   6A 5369676E617475726531   (text(10) "Signature1")
    //   43 A10126                 (bstr(3) protected header)
    //   40                        (bstr(0) empty external AAD)
    //   44 D8184100               (bstr(4) payload / MSO bytes)
    const expected = hexToBytes(
      "84" + "6A 5369676E617475726531" + "43 A10126" + "40" + "44 D8184100",
    );

    expect(result).toEqual(expected);
  });

  it("encodes an empty external AAD as an empty byte string", () => {
    const protectedHeader = hexToBytes("A0"); // empty map {}
    const msoBytes = hexToBytes("00"); // unsigned(0)

    const result = buildToBeSigned(protectedHeader, msoBytes);

    // ["Signature1", h'A0', h'', h'00']
    // = 84
    //   6A 5369676E617475726531
    //   41 A0
    //   40
    //   41 00
    const expected = hexToBytes(
      "84" + "6A 5369676E617475726531" + "41 A0" + "40" + "41 00",
    );

    expect(result).toEqual(expected);
  });
});
