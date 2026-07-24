import { describe, expect, it } from "vitest";
import { decode, TaggedValue } from "../cbor/index.js";
import { buildIssuerSignedItems } from "./issuerSignedItem.js";
import { DateFormat } from "../types";
import type { DataElement, NameSpaces } from "../types";

function decodeCbor(bytes: Uint8Array): unknown {
  return decode(bytes);
}

function makeNameSpaces(entries: [string, DataElement[]][]): NameSpaces {
  return new Map(entries);
}

function decodeIssuerSignedItem(tag24Bytes: Uint8Array): Map<string, unknown> {
  const tag24 = decodeCbor(tag24Bytes) as TaggedValue;
  return decodeCbor(tag24.contents as Uint8Array) as Map<string, unknown>;
}

describe("buildIssuerSignedItems CBOR integration", () => {
  describe("IssuerSignedItem structure", () => {
    it("contains exactly digestID, random, elementIdentifier, and elementValue", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "family_name", elementValue: "Smith" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      const keys = [...item.keys()];
      expect(keys).toHaveLength(4);
      expect(keys).toContain("digestID");
      expect(keys).toContain("random");
      expect(keys).toContain("elementIdentifier");
      expect(keys).toContain("elementValue");
    });

    it("preserves the elementIdentifier", async () => {
      const nameSpaces = makeNameSpaces([
        [
          "ns",
          [{ elementIdentifier: "birth_date", elementValue: "1990-01-01" }],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      expect(item.get("elementIdentifier")).toBe("birth_date");
    });

    it("preserves string elementValue", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "family_name", elementValue: "Smith" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      expect(item.get("elementValue")).toBe("Smith");
    });

    it("preserves number elementValue", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "age", elementValue: 30 }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      expect(item.get("elementValue")).toBe(30);
    });

    it("preserves Uint8Array elementValue", async () => {
      const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "portrait", elementValue: bytes }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      expect(new Uint8Array(item.get("elementValue") as Uint8Array)).toEqual(
        bytes,
      );
    });

    it("preserves array elementValue", async () => {
      const nameSpaces = makeNameSpaces([
        [
          "ns",
          [{ elementIdentifier: "categories", elementValue: ["A", "B", "C"] }],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      expect(item.get("elementValue")).toEqual(["A", "B", "C"]);
    });
  });

  describe("Tag 24 encoding", () => {
    it("wraps the IssuerSignedItem in CBOR Tag 24", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "name", elementValue: "test" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const decoded = decodeCbor(items?.[0] as Uint8Array) as TaggedValue;
      expect(decoded).toBeInstanceOf(TaggedValue);
      expect(decoded.tagNumber).toBe(24);
    });

    it("Tag 24 contents is valid CBOR that decodes to the IssuerSignedItem", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "family_name", elementValue: "Doe" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const tag24 = decodeCbor(items?.[0] as Uint8Array) as TaggedValue;
      const inner = decodeCbor(tag24.contents as Uint8Array) as Map<
        string,
        unknown
      >;
      expect(inner.get("elementIdentifier")).toBe("family_name");
      expect(inner.get("elementValue")).toBe("Doe");
    });
  });

  describe("digest computation", () => {
    it("computes SHA-256 over the Tag 24 encoded bytes", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "name", elementValue: "test" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const tag24Bytes = items?.[0] as Uint8Array;
      const digests = result.valueDigests.get("ns");
      const entries = [...(digests?.entries() ?? [])];
      const firstEntry = entries[0];
      expect(firstEntry).toBeDefined();
      const [digestId, storedDigest] = firstEntry as [number, Uint8Array];

      // Recompute the digest ourselves
      const expectedDigest = new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          tag24Bytes as Uint8Array<ArrayBuffer>,
        ),
      );

      expect(storedDigest).toEqual(expectedDigest);
      expect(storedDigest.length).toBe(32); // SHA-256 is 32 bytes
      expect(digestId).toBeTypeOf("number");
    });

    it("produces different digests for different elements", async () => {
      const nameSpaces = makeNameSpaces([
        [
          "ns",
          [
            { elementIdentifier: "a", elementValue: "1" },
            { elementIdentifier: "b", elementValue: "2" },
          ],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const digests = [...(result.valueDigests.get("ns")?.values() ?? [])];
      expect(digests[0]).not.toEqual(digests[1]);
    });

    it("stores digest under the correct digestID in valueDigests", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "name", elementValue: "test" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const tag24Bytes = items?.[0] as Uint8Array;
      const item = decodeIssuerSignedItem(tag24Bytes);
      const digestId = item.get("digestID") as number;

      const digests = result.valueDigests.get("ns");
      expect(digests?.has(digestId)).toBe(true);

      // Verify the stored digest matches the hash of the tag24 bytes
      const expectedDigest = new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          tag24Bytes as Uint8Array<ArrayBuffer>,
        ),
      );
      expect(digests?.get(digestId)).toEqual(expectedDigest);
    });
  });

  describe("date encoding", () => {
    it("encodes Date with DateFormat.FullDate as Tag 1004", async () => {
      const date = new Date("2024-07-24T00:00:00Z");
      const nameSpaces = makeNameSpaces([
        [
          "ns",
          [
            {
              elementIdentifier: "birth_date",
              elementValue: date,
              dateFormat: DateFormat.FullDate,
            },
          ],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      const value = item.get("elementValue") as TaggedValue;

      expect(value).toBeInstanceOf(TaggedValue);
      expect(value.tagNumber).toBe(1004);
      expect(value.contents).toBe("2024-07-24");
    });

    it("encodes Date with DateFormat.DateTime as Tag 0", async () => {
      const date = new Date("2024-07-24T15:30:00.000Z");
      const nameSpaces = makeNameSpaces([
        [
          "ns",
          [
            {
              elementIdentifier: "issue_date",
              elementValue: date,
              dateFormat: DateFormat.DateTime,
            },
          ],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      const value = item.get("elementValue") as TaggedValue;

      expect(value).toBeInstanceOf(TaggedValue);
      expect(value.tagNumber).toBe(0);
      expect(value.contents).toBe("2024-07-24T15:30:00Z");
    });

    it("defaults to Tag 0 (tdate) when dateFormat is not specified for Date values", async () => {
      const date = new Date("2024-07-24T12:00:00.000Z");
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "timestamp", elementValue: date }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      const value = item.get("elementValue") as TaggedValue;

      expect(value).toBeInstanceOf(TaggedValue);
      expect(value.tagNumber).toBe(0);
      expect(value.contents).toBe("2024-07-24T12:00:00Z");
    });

    it("encodes Date in an array with FullDate format", async () => {
      const dates = [
        new Date("2020-01-01T00:00:00Z"),
        new Date("2025-12-31T00:00:00Z"),
      ];
      const nameSpaces = makeNameSpaces([
        [
          "ns",
          [
            {
              elementIdentifier: "dates",
              elementValue: dates,
              dateFormat: DateFormat.FullDate,
            },
          ],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      const value = item.get("elementValue") as TaggedValue[];

      expect(value).toHaveLength(2);
      const first = value[0] as TaggedValue;
      const second = value[1] as TaggedValue;
      expect(first).toBeInstanceOf(TaggedValue);
      expect(first.tagNumber).toBe(1004);
      expect(first.contents).toBe("2020-01-01");
      expect(second.tagNumber).toBe(1004);
      expect(second.contents).toBe("2025-12-31");
    });
  });

  describe("Map element values", () => {
    it("encodes Map<string, PrimitiveElementValue> correctly", async () => {
      const mapValue = new Map<string, string | number>([
        ["street", "123 Main St"],
        ["zip", 12345],
      ]);
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "address", elementValue: mapValue }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      const value = item.get("elementValue") as Map<string, unknown>;

      expect(value).toBeInstanceOf(Map);
      expect(value.get("street")).toBe("123 Main St");
      expect(value.get("zip")).toBe(12345);
    });

    it("encodes Map<string, PrimitiveElementValue>[] correctly", async () => {
      const maps = [
        new Map<string, string | number>([
          ["code", "A"],
          ["value", 1],
        ]),
        new Map<string, string | number>([
          ["code", "B"],
          ["value", 2],
        ]),
      ];
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "categories", elementValue: maps }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("ns");
      const item = decodeIssuerSignedItem(items?.[0] as Uint8Array);
      const value = item.get("elementValue") as Map<string, unknown>[];

      expect(value).toHaveLength(2);
      const first = value[0] as Map<string, unknown>;
      const second = value[1] as Map<string, unknown>;
      expect(first).toBeInstanceOf(Map);
      expect(first.get("code")).toBe("A");
      expect(first.get("value")).toBe(1);
      expect(second.get("code")).toBe("B");
      expect(second.get("value")).toBe(2);
    });
  });
});
