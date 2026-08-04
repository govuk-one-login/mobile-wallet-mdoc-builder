import { describe, expect, it, vi } from "vitest";
import type { DataElement, NameSpaces } from "../types";
import { DateFormat } from "../types";

// Mock node:crypto with seeded randomness — do NOT mock src/cbor (real encoder used)
vi.mock("node:crypto", () => {
  // digestId bytes: readUInt32BE(0) >>> 1 = 42, so readUInt32BE(0) = 84 = 0x54
  const digestIdBytes = Buffer.from([0x00, 0x00, 0x00, 0x54]);
  // salt: 16 bytes of 0xAA
  const saltBytes = Buffer.from(new Array(16).fill(0xaa));

  return {
    randomBytes: (size: number) => {
      if (size === 4) return digestIdBytes;
      if (size === 16) return saltBytes;
      return Buffer.alloc(size);
    },
  };
});

const { buildIssuerSignedItems } = await import("./issuerSignedItem.js");

function makeNameSpaces(entries: [string, DataElement[]][]): NameSpaces {
  return new Map(entries);
}

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

describe("issuerSignedItem byte-level smoke tests", () => {
  it("produces spec-correct bytes for a string element value", async () => {
    // Input: single element with string value "Smith"
    const nameSpaces = makeNameSpaces([
      [
        "org.iso.18013.5.1",
        [{ elementIdentifier: "family_name", elementValue: "Smith" }],
      ],
    ]);

    const result = await buildIssuerSignedItems(nameSpaces);

    // Expected bytes derived from cbor.me:
    // 24(<<{"digestID": 42, "random": h'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    //       "elementIdentifier": "family_name", "elementValue": "Smith"}>>)
    // = D8 18 58 55 A4 68 "digestID" 18 2A 66 "random" 50 <16×AA>
    //   71 "elementIdentifier" 6B "family_name" 6C "elementValue" 65 "Smith"
    const expectedTag24Bytes = hexToBytes(
      "D8 18 58 55" +
        "A4" +
        "68 6469676573744944" +
        "18 2A" +
        "66 72616E646F6D" +
        "50 AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
        "71 656C656D656E744964656E746966696572" +
        "6B 66616D696C795F6E616D65" +
        "6C 656C656D656E7456616C7565" +
        "65 536D697468",
    );

    const items = result.issuerSignedItemBytes.get("org.iso.18013.5.1");
    expect(items).toBeDefined();
    expect(items).toHaveLength(1);
    expect(items?.[0]).toEqual(expectedTag24Bytes);

    // Verify the stored digest is SHA-256 of the tag24Bytes
    const expectedDigest = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        expectedTag24Bytes as Uint8Array<ArrayBuffer>,
      ),
    );
    const digests = result.valueDigests.get("org.iso.18013.5.1");
    expect(digests).toBeDefined();
    const storedDigest = [...(digests?.values() ?? [])][0];
    expect(storedDigest).toEqual(expectedDigest);
  });

  it("produces spec-correct bytes for a full-date element value (Tag 1004)", async () => {
    // Input: single element with Date value and DateFormat.FullDate
    const nameSpaces = makeNameSpaces([
      [
        "org.iso.18013.5.1",
        [
          {
            elementIdentifier: "birth_date",
            elementValue: new Date("1990-01-15T00:00:00Z"),
            dateFormat: DateFormat.FullDate,
          },
        ],
      ],
    ]);

    const result = await buildIssuerSignedItems(nameSpaces);

    // Expected bytes derived from cbor.me:
    // 24(<<{"digestID": 42, "random": h'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    //       "elementIdentifier": "birth_date", "elementValue": 1004("1990-01-15")}>>)
    // Total: 96 bytes (D8 18 58 5C + 92 inner bytes)
    const expectedTag24Bytes = hexToBytes(
      "D8 18 58 5C" +
        "A4" +
        "68 6469676573744944" +
        "18 2A" +
        "66 72616E646F6D" +
        "50 AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
        "71 656C656D656E744964656E746966696572" +
        "6A 62697274685F64617465" +
        "6C 656C656D656E7456616C7565" +
        "D9 03EC" +
        "6A 313939302D30312D3135",
    );

    const items = result.issuerSignedItemBytes.get("org.iso.18013.5.1");
    expect(items).toBeDefined();
    expect(items).toHaveLength(1);
    expect(items?.[0]).toEqual(expectedTag24Bytes);
  });

  it("produces spec-correct bytes for a tdate element value (Tag 0)", async () => {
    // Input: single element with Date value (default tdate encoding)
    const nameSpaces = makeNameSpaces([
      [
        "org.iso.18013.5.1",
        [
          {
            elementIdentifier: "issue_date",
            elementValue: new Date("2024-03-01T00:00:00Z"),
          },
        ],
      ],
    ]);

    const result = await buildIssuerSignedItems(nameSpaces);

    // Expected bytes derived from cbor.me:
    // 24(<<{"digestID": 42, "random": h'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    //       "elementIdentifier": "issue_date", "elementValue": 0("2024-03-01T00:00:00Z")}>>)
    // Total: 104 bytes (D8 18 58 64 + 100 inner bytes)
    const expectedTag24Bytes = hexToBytes(
      "D8 18 58 64" +
        "A4" +
        "68 6469676573744944" +
        "18 2A" +
        "66 72616E646F6D" +
        "50 AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
        "71 656C656D656E744964656E746966696572" +
        "6A 69737375655F64617465" +
        "6C 656C656D656E7456616C7565" +
        "C0" +
        "74 323032342D30332D30315430303A30303A30305A",
    );

    const items = result.issuerSignedItemBytes.get("org.iso.18013.5.1");
    expect(items).toBeDefined();
    expect(items).toHaveLength(1);
    expect(items?.[0]).toEqual(expectedTag24Bytes);
  });
});
