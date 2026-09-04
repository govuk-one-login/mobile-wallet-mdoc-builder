import { describe, expect, it } from "vitest";
// Real cbor encoder used
import { buildToBeSigned } from "./buildToBeSigned.js";

describe("buildToBeSigned byte-level smoke tests", () => {
  it("produces spec-correct Sig_Structure bytes (RFC 9052 §4.4)", () => {
    // protected header: {1: -7} (ES256) = h'A10126'
    const protectedHeader = new Uint8Array(Buffer.from("A10126", "hex"));
    // tag 24 wrapped MSO bytes: 24(h'00') = h'D8184100'
    const msoBytes = new Uint8Array(Buffer.from("D8184100", "hex"));

    const result = buildToBeSigned(protectedHeader, msoBytes);

    // Expected bytes derived from cbor.me:
    // ["Signature1", h'A10126', h'', h'D8184100']
    // = 84                       array(4)
    //   6A 5369676E617475726531  text(10) "Signature1"
    //   43 A10126                bstr(3) protected header
    //   40                       bstr(0) empty external AAD
    //   44 D8184100              bstr(4) payload / MSO bytes
    const expected = new Uint8Array(
      Buffer.from("846A5369676E61747572653143A101264044D8184100", "hex"),
    );

    expect(result).toEqual(expected);
  });
});
