import { describe, expect, it } from "vitest";
import type { DeviceKeyInfo } from "../deviceKey";
import type { ValidityInfo } from "../validityInfo";
import type { StatusList } from "../types";
// NOTE: do NOT mock src/cbor here — this suite uses the real encoder to assert
// byte-exact MSO output. The MSO is the signed payload, so any byte-level
// regression (tag numbers, tdate timezone, integer form, map length) would
// silently break verification. The mocked buildMso.test.ts cannot catch these.
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
 * Realistic MSO fixture: full COSE_Key (kty/crv/x/y), keyAuthorizations,
 * 32-byte SHA-256-sized digests, and real docType/status URI. Deterministic
 * dates so the tdate bytes are stable.
 */
function makeMsoInput(overrides?: Partial<MsoInput>): MsoInput {
  const coseKey = new Map<number, number | Uint8Array>([
    [1, 2], // kty: EC2
    [-1, 1], // crv: P-256
    [-2, new Uint8Array(32).fill(0x01)], // x
    [-3, new Uint8Array(32).fill(0x02)], // y
  ]);
  const keyAuthorizations = new Map<string, string[]>([
    ["nameSpaces", ["org.iso.18013.5.1"]],
  ]);
  const deviceKeyInfo: DeviceKeyInfo = new Map();
  deviceKeyInfo.set("deviceKey", coseKey);
  deviceKeyInfo.set("keyAuthorizations", keyAuthorizations);

  const valueDigests = new Map<string, Map<number, Uint8Array>>([
    [
      "org.iso.18013.5.1",
      new Map<number, Uint8Array>([
        [0, new Uint8Array(32).fill(0xaa)],
        [1, new Uint8Array(32).fill(0xbb)],
      ]),
    ],
  ]);

  const validityInfo: ValidityInfo = {
    signed: new Date("2026-07-01T12:00:00Z"),
    validFrom: new Date("2026-07-01T12:00:00Z"),
    validUntil: new Date("2027-07-01T12:00:00Z"),
  };

  const statusList: StatusList = {
    idx: 42,
    uri: "https://example.com/status/1",
  };

  return {
    docType: "org.iso.18013.5.1.mDL",
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

    // Diagnostic notation (verified via cbor.me and the real cbor2 encoder):
    // 24(<<{
    //   "version": "1.0",
    //   "digestAlgorithm": "SHA-256",
    //   "valueDigests": {"org.iso.18013.5.1": {0: h'AA*32', 1: h'BB*32'}},
    //   "deviceKeyInfo": {
    //     "deviceKey": {1: 2, -1: 1, -2: h'01*32', -3: h'02*32'},
    //     "keyAuthorizations": {"nameSpaces": ["org.iso.18013.5.1"]}
    //   },
    //   "validityInfo": {
    //     "signed":     0("2026-07-01T12:00:00Z"),
    //     "validFrom":  0("2026-07-01T12:00:00Z"),
    //     "validUntil": 0("2027-07-01T12:00:00Z")
    //   },
    //   "status": {"status_list": {"idx": 42, "uri": "https://example.com/status/1"}},
    //   "docType": "org.iso.18013.5.1.mDL"
    // }>>)
    //
    // Guards baked into these bytes:
    //   D8 18       -> tag(24) wrapper (RFC 8949 §3.4.5.1)
    //   59 01E8     -> bstr(488) definite-length payload
    //   A7          -> map(7) definite-length top-level map
    //   00 / 01     -> digestIDs as shortest-form unsigned ints
    //   18 2A       -> idx 42 as shortest-form unsigned int
    //   20          -> COSE_Key -1 as shortest-form negative int
    //   C0 74 ...5A -> each tdate is tag(0) + text(20) ending in "Z" (5A), no offset
    const expected = hexToBytes(
      "D818" +
        "5901E8" +
        "A76776657273696F6E63312E306F646967657374416C676F726974686D675348412D3235366C76616C756544696765737473A1716F72672E69736F2E31383031332E352E31A2005820AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA015820BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB6D6465766963654B6579496E666FA2696465766963654B6579A40102200121582001010101010101010101010101010101010101010101010101010101010101012258200202020202020202020202020202020202020202020202020202020202020202716B6579417574686F72697A6174696F6E73A16A6E616D6553706163657381716F72672E69736F2E31383031332E352E316C76616C6964697479496E666FA3667369676E6564C074323032362D30372D30315431323A30303A30305A6976616C696446726F6DC074323032362D30372D30315431323A30303A30305A6A76616C6964556E74696CC074323032372D30372D30315431323A30303A30305A66737461747573A16B7374617475735F6C697374A263696478182A63757269781C68747470733A2F2F6578616D706C652E636F6D2F7374617475732F3167646F6354797065756F72672E69736F2E31383031332E352E312E6D444C",
    );

    expect(result).toEqual(expected);
  });

  it("produces spec-correct tag-24-wrapped bytes with expectedUpdate", () => {
    const result = buildMso(
      makeMsoInput({
        validityInfo: {
          signed: new Date("2026-07-01T12:00:00Z"),
          validFrom: new Date("2026-07-01T12:00:00Z"),
          validUntil: new Date("2027-07-01T12:00:00Z"),
          expectedUpdate: new Date("2026-10-01T12:00:00Z"),
        },
      }),
    );

    // Same fixture with a 4th validityInfo entry:
    //   "expectedUpdate": 0("2026-10-01T12:00:00Z")
    // validityInfo becomes A4 (map(4)); the wrapper grows to bstr(525) -> 59 020D.
    const expected = hexToBytes(
      "D818" +
        "59020D" +
        "A76776657273696F6E63312E306F646967657374416C676F726974686D675348412D3235366C76616C756544696765737473A1716F72672E69736F2E31383031332E352E31A2005820AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA015820BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB6D6465766963654B6579496E666FA2696465766963654B6579A40102200121582001010101010101010101010101010101010101010101010101010101010101012258200202020202020202020202020202020202020202020202020202020202020202716B6579417574686F72697A6174696F6E73A16A6E616D6553706163657381716F72672E69736F2E31383031332E352E316C76616C6964697479496E666FA4667369676E6564C074323032362D30372D30315431323A30303A30305A6976616C696446726F6DC074323032362D30372D30315431323A30303A30305A6A76616C6964556E74696CC074323032372D30372D30315431323A30303A30305A6E6578706563746564557064617465C074323032362D31302D30315431323A30303A30305A66737461747573A16B7374617475735F6C697374A263696478182A63757269781C68747470733A2F2F6578616D706C652E636F6D2F7374617475732F3167646F6354797065756F72672E69736F2E31383031332E352E312E6D444C",
    );

    expect(result).toEqual(expected);
  });

  it("emits Z (not a numeric offset) for tdate values", () => {
    const result = buildMso(makeMsoInput());

    const text = new TextDecoder().decode(result);
    expect(text).toContain("2026-07-01T12:00:00Z");
    // A numeric offset (e.g. +01:00) would introduce a sign after the seconds.
    expect(text).not.toMatch(/\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/);
  });

  it("wraps the payload in tag 24 (0xd8 0x18)", () => {
    const result = buildMso(makeMsoInput());

    // RFC 8949 §3.4.5.1 — encoded CBOR data item tag.
    expect(result[0]).toBe(0xd8);
    expect(result[1]).toBe(0x18);
  });
});
