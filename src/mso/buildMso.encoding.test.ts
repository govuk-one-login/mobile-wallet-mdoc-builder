import { describe, expect, it } from "vitest";
import type { DeviceKeyInfo } from "../deviceKey";
import type { ValidityInfo } from "../validityInfo";
import type { StatusList } from "../types";
import { buildMso, type MsoInput } from "./buildMso.js";

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

/**
 * Minimal, easily hand-verifiable inputs. Short namespace/docType/uri strings
 * keep the expected bytes readable and traceable to CBOR diagnostic notation.
 */
function makeMsoInput(overrides?: Partial<MsoInput>): MsoInput {
  const deviceKeyInfo: DeviceKeyInfo = new Map();
  // COSE_Key {1: 2} — minimal, enough to prove deviceKeyInfo is embedded as-is.
  deviceKeyInfo.set("deviceKey", new Map<number, number>([[1, 2]]));

  const valueDigests = new Map<string, Map<number, Uint8Array>>([
    ["ns", new Map<number, Uint8Array>([[0, new Uint8Array(2).fill(0xaa)]])],
  ]);

  const validityInfo: ValidityInfo = {
    signed: new Date("2024-01-15T12:00:00Z"),
    validFrom: new Date("2024-01-15T12:00:00Z"),
    validUntil: new Date("2025-01-15T12:00:00Z"),
  };

  const statusList: StatusList = { idx: 5, uri: "u" };

  return {
    docType: "d",
    valueDigests,
    deviceKeyInfo,
    validityInfo,
    statusList,
    ...overrides,
  };
}

describe("buildMso byte-level encoding", () => {
  it("produces spec-correct tag-24-wrapped bytes without expectedUpdate", () => {
    const result = buildMso(makeMsoInput());

    // Diagnostic notation (see docs/cbor-test-guide.md, verified via cbor.me):
    // 24(<<{
    //   "version": "1.0",
    //   "digestAlgorithm": "SHA-256",
    //   "valueDigests": {"ns": {0: h'AAAA'}},
    //   "deviceKeyInfo": {"deviceKey": {1: 2}},
    //   "validityInfo": {
    //     "signed":     0("2024-01-15T12:00:00Z"),
    //     "validFrom":  0("2024-01-15T12:00:00Z"),
    //     "validUntil": 0("2025-01-15T12:00:00Z")
    //   },
    //   "status": {"status_list": {"idx": 5, "uri": "u"}},
    //   "docType": "d"
    // }>>)
    const expected = hexToBytes(
      "d8 18 58 ed" + // tag(24), bstr(237) — tag-24 wrapper + definite-length bstr
        "a7" + // map(7) — definite-length, 7 entries
        "67 76657273696f6e 63 312e30" + // "version": "1.0"
        "6f 646967657374416c676f726974686d 67 5348412d323536" + // "digestAlgorithm": "SHA-256"
        "6c 76616c756544696765737473 a1 62 6e73 a1 00 42 aaaa" + // valueDigests: {"ns":{0:h'AAAA'}} — 00 = shortest-form uint(0)
        "6d 6465766963654b6579496e666f a1 69 6465766963654b6579 a1 01 02" + // deviceKeyInfo: {"deviceKey":{1:2}}
        "6c 76616c6964697479496e666f a3" + // "validityInfo": map(3) — no expectedUpdate
        "66 7369676e6564 c0 74 323032342d30312d31355431323a30303a30305a" + // "signed": tag(0) "2024-01-15T12:00:00Z" (Z, no offset)
        "69 76616c696446726f6d c0 74 323032342d30312d31355431323a30303a30305a" + // "validFrom": tag(0) ...Z
        "6a 76616c6964556e74696c c0 74 323032352d30312d31355431323a30303a30305a" + // "validUntil": tag(0) ...Z
        "66 737461747573 a1 6b 7374617475735f6c697374 a2 63 696478 05 63 757269 61 75" + // status: {"status_list":{"idx":5,"uri":"u"}} — 05 = shortest-form uint(5)
        "67 646f6354797065 61 64", // "docType": "d"
    );

    expect(result).toEqual(expected);
  });

  it("produces spec-correct tag-24-wrapped bytes with expectedUpdate", () => {
    const result = buildMso(
      makeMsoInput({
        validityInfo: {
          signed: new Date("2024-01-15T12:00:00Z"),
          validFrom: new Date("2024-01-15T12:00:00Z"),
          validUntil: new Date("2025-01-15T12:00:00Z"),
          expectedUpdate: new Date("2024-07-15T12:00:00Z"),
        },
      }),
    );

    // Same structure as above, but validityInfo is map(4) with a 4th entry:
    //   "expectedUpdate": 0("2024-07-15T12:00:00Z")
    const expected = hexToBytes(
      "d8 18 59 0112" + // tag(24), bstr(274) — 2-byte length now that map grew
        "a7" + // map(7)
        "67 76657273696f6e 63 312e30" + // "version": "1.0"
        "6f 646967657374416c676f726974686d 67 5348412d323536" + // "digestAlgorithm": "SHA-256"
        "6c 76616c756544696765737473 a1 62 6e73 a1 00 42 aaaa" + // valueDigests
        "6d 6465766963654b6579496e666f a1 69 6465766963654b6579 a1 01 02" + // deviceKeyInfo
        "6c 76616c6964697479496e666f a4" + // "validityInfo": map(4)
        "66 7369676e6564 c0 74 323032342d30312d31355431323a30303a30305a" + // "signed"
        "69 76616c696446726f6d c0 74 323032342d30312d31355431323a30303a30305a" + // "validFrom"
        "6a 76616c6964556e74696c c0 74 323032352d30312d31355431323a30303a30305a" + // "validUntil"
        "6e 6578706563746564557064617465 c0 74 323032342d30372d31355431323a30303a30305a" + // "expectedUpdate": tag(0) ...Z
        "66 737461747573 a1 6b 7374617475735f6c697374 a2 63 696478 05 63 757269 61 75" + // status
        "67 646f6354797065 61 64", // "docType": "d"
    );

    expect(result).toEqual(expected);
  });

  it("emits Z (not a numeric offset) for tdate values", () => {
    const result = buildMso(makeMsoInput());

    // "Z" is 0x5a; a numeric offset would introduce '+'/'-' (0x2b/0x2d)
    // and a ':' inside the offset. Assert the UTC designator is present and
    // no offset sign bytes leak in.
    const text = new TextDecoder().decode(result);
    expect(text).toContain("2024-01-15T12:00:00Z");
    expect(text).not.toMatch(/\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/);
  });

  it("wraps the payload in tag 24 (0xd8 0x18)", () => {
    const result = buildMso(makeMsoInput());

    // RFC 8949 §3.4.5.1 — encoded CBOR data item tag.
    expect(result[0]).toBe(0xd8);
    expect(result[1]).toBe(0x18);
  });
});
