import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataElement, NameSpaces } from "../types";

const mockEncode = vi.fn<(value: unknown) => Uint8Array>();
const mockEmbeddedCbor = vi.fn<(bytes: Uint8Array) => unknown>();
const mockTdate = vi.fn<(date: Date) => unknown>();
const mockFullDate = vi.fn<(date: string) => unknown>();

vi.mock("../cbor/index.js", () => ({
  encode: (value: unknown) => mockEncode(value),
  embeddedCbor: (bytes: Uint8Array) => mockEmbeddedCbor(bytes),
  tdate: (date: Date) => mockTdate(date),
  fullDate: (date: string) => mockFullDate(date),
  TaggedValue: class TaggedValue {
    constructor(
      public tagNumber: number,
      public contents: unknown,
    ) {}
  },
}));

// Import after mock is set up
const { buildIssuerSignedItems } = await import("./issuerSignedItem.js");

function makeNameSpaces(entries: [string, DataElement[]][]): NameSpaces {
  return new Map(entries);
}

describe("buildIssuerSignedItems", () => {
  let encodeCallCount: number;

  beforeEach(() => {
    vi.clearAllMocks();
    encodeCallCount = 0;
    mockEncode.mockImplementation(() => {
      // Return a unique Uint8Array for each call so digests differ
      const bytes = new Uint8Array([encodeCallCount++]);
      return bytes;
    });
    mockEmbeddedCbor.mockImplementation((bytes: Uint8Array) => ({
      type: "embedded-cbor",
      bytes,
    }));
    mockTdate.mockImplementation((date: Date) => ({
      type: "tdate",
      date,
    }));
    mockFullDate.mockImplementation((dateStr: string) => ({
      type: "full-date",
      dateStr,
    }));
  });

  describe("output structure", () => {
    it("returns both issuerSignedItemBytes and valueDigests maps", async () => {
      const nameSpaces = makeNameSpaces([
        [
          "org.iso.18013.5.1",
          [{ elementIdentifier: "family_name", elementValue: "Smith" }],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      expect(result.issuerSignedItemBytes).toBeInstanceOf(Map);
      expect(result.valueDigests).toBeInstanceOf(Map);
    });

    it("produces entries for each namespace", async () => {
      const nameSpaces = makeNameSpaces([
        [
          "org.iso.18013.5.1",
          [{ elementIdentifier: "family_name", elementValue: "Smith" }],
        ],
        [
          "uk.gov.account.mobile.example-credential-issuer.simplemdoc.1.json",
          [{ elementIdentifier: "issuing_country", elementValue: "UK" }],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      expect(result.issuerSignedItemBytes.size).toBe(2);
      expect(result.valueDigests.size).toBe(2);
      expect(result.issuerSignedItemBytes.has("org.iso.18013.5.1")).toBe(true);
      expect(
        result.issuerSignedItemBytes.has(
          "uk.gov.account.mobile.example-credential-issuer.simplemdoc.1.json",
        ),
      ).toBe(true);
    });

    it("produces one item per data element in the namespace", async () => {
      const nameSpaces = makeNameSpaces([
        [
          "org.iso.18013.5.1",
          [
            { elementIdentifier: "family_name", elementValue: "Smith" },
            { elementIdentifier: "given_name", elementValue: "John" },
            { elementIdentifier: "resident_city", elementValue: "London" },
          ],
        ],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("org.iso.18013.5.1");
      const digests = result.valueDigests.get("org.iso.18013.5.1");
      expect(items).toHaveLength(3);
      expect(digests?.size).toBe(3);
    });

    it("handles empty namespaces", async () => {
      const nameSpaces = makeNameSpaces([["org.iso.18013.5.1", []]]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const items = result.issuerSignedItemBytes.get("org.iso.18013.5.1");
      const digests = result.valueDigests.get("org.iso.18013.5.1");
      expect(items).toHaveLength(0);
      expect(digests?.size).toBe(0);
    });
  });

  describe("namespace isolation", () => {
    it("generates unique digestIDs within a namespace", async () => {
      const elements: DataElement[] = Array.from({ length: 50 }, (_, i) => ({
        elementIdentifier: String(i),
        elementValue: String(i),
      }));
      const nameSpaces = makeNameSpaces([["ns", elements]]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const digests = result.valueDigests.get("ns");
      expect(digests).toBeDefined();
      const ids = [...(digests?.keys() ?? [])];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("allows the same digestID to appear in different namespaces", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns1", [{ elementIdentifier: "a", elementValue: "1" }]],
        ["ns2", [{ elementIdentifier: "b", elementValue: "2" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      // Both namespaces should independently have their own digest IDs
      expect(result.valueDigests.get("ns1")?.size).toBe(1);
      expect(result.valueDigests.get("ns2")?.size).toBe(1);
    });
  });

  describe("orchestration", () => {
    it("stores the tag24 bytes from buildSingleItem in issuerSignedItemBytes", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "name", elementValue: "test" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const tag24Bytes = mockEncode.mock.results[1]?.value as
        | Uint8Array
        | undefined;
      const items = result.issuerSignedItemBytes.get("ns");
      expect(items?.[0]).toStrictEqual(tag24Bytes);
    });

    it("stores the digest from digestItem in valueDigests", async () => {
      const nameSpaces = makeNameSpaces([
        ["ns", [{ elementIdentifier: "name", elementValue: "test" }]],
      ]);

      const result = await buildIssuerSignedItems(nameSpaces);

      const tag24Bytes = mockEncode.mock.results[1]?.value as
        | Uint8Array
        | undefined;
      expect(tag24Bytes).toBeDefined();
      const digests = result.valueDigests.get("ns");
      const storedDigest = [...(digests?.values() ?? [])][0];
      expect(storedDigest).toBeDefined();

      const expectedDigest = new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          tag24Bytes as Uint8Array<ArrayBuffer>,
        ),
      );

      expect(storedDigest).toEqual(expectedDigest);
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
  });
});
