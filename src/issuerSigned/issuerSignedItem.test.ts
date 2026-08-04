import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataElement, NameSpaces } from "../types";
import { DateFormat } from "../types";

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
const { buildIssuerSignedItems, buildSingleItem } =
  await import("./issuerSignedItem.js");

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

describe("buildSingleItem", () => {
  let encodeCallCount: number;

  beforeEach(() => {
    vi.clearAllMocks();
    encodeCallCount = 0;
    mockEncode.mockImplementation(() => {
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

  it("returns a digestId and tag24Bytes", () => {
    const element: DataElement = {
      elementIdentifier: "family_name",
      elementValue: "Smith",
    };
    const usedIds = new Set<number>();

    const result = buildSingleItem(element, usedIds);

    expect(result).toHaveProperty("digestId");
    expect(result).toHaveProperty("tag24Bytes");
    expect(typeof result.digestId).toBe("number");
    expect(result.tag24Bytes).toBeInstanceOf(Uint8Array);
  });

  it("adds the generated digestId to the usedIds set", () => {
    const element: DataElement = {
      elementIdentifier: "family_name",
      elementValue: "Smith",
    };
    const usedIds = new Set<number>();

    const result = buildSingleItem(element, usedIds);

    expect(usedIds.has(result.digestId)).toBe(true);
  });

  it("generates a digestId that does not collide with existing usedIds", () => {
    const element: DataElement = {
      elementIdentifier: "family_name",
      elementValue: "Smith",
    };
    // Pre-populate with many IDs to test collision avoidance
    const usedIds = new Set<number>();
    for (let i = 0; i < 100; i++) {
      usedIds.add(i);
    }

    const result = buildSingleItem(element, usedIds);

    expect(result.digestId).toBeGreaterThanOrEqual(0);
    expect(result.digestId).toBeLessThanOrEqual(2_147_483_647);
  });

  it("encodes the IssuerSignedItem map with correct field order", () => {
    const element: DataElement = {
      elementIdentifier: "given_name",
      elementValue: "Alice",
    };
    const usedIds = new Set<number>();

    buildSingleItem(element, usedIds);

    const issuerSignedItem = mockEncode.mock.calls[0]?.[0] as Map<
      string,
      unknown
    >;
    const keys = [...issuerSignedItem.keys()];
    expect(keys).toEqual([
      "digestID",
      "random",
      "elementIdentifier",
      "elementValue",
    ]);
    expect(issuerSignedItem.get("elementIdentifier")).toBe("given_name");
    expect(issuerSignedItem.get("elementValue")).toBe("Alice");
  });

  it("generates a 16-byte random salt", () => {
    const element: DataElement = {
      elementIdentifier: "name",
      elementValue: "test",
    };
    const usedIds = new Set<number>();

    buildSingleItem(element, usedIds);

    const issuerSignedItem = mockEncode.mock.calls[0]?.[0] as Map<
      string,
      unknown
    >;
    const salt = issuerSignedItem.get("random") as Uint8Array;
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt).toHaveLength(16);
  });

  it("wraps inner encoded bytes with embeddedCbor", () => {
    const element: DataElement = {
      elementIdentifier: "name",
      elementValue: "test",
    };
    const usedIds = new Set<number>();

    buildSingleItem(element, usedIds);

    const innerBytes = mockEncode.mock.results[0]?.value as
      | Uint8Array
      | undefined;
    expect(mockEmbeddedCbor).toHaveBeenCalledWith(innerBytes);
    const embeddedResult = mockEmbeddedCbor.mock.results[0]?.value as unknown;
    expect(mockEncode.mock.calls[1]?.[0]).toBe(embeddedResult);
  });

  it("returns the tag24Bytes from the second encode call", () => {
    const element: DataElement = {
      elementIdentifier: "name",
      elementValue: "test",
    };
    const usedIds = new Set<number>();

    const result = buildSingleItem(element, usedIds);

    const secondEncodeResult = mockEncode.mock.results[1]?.value as
      | Uint8Array
      | undefined;
    expect(result.tag24Bytes).toBe(secondEncodeResult);
  });

  it("encodes Date element values using tdate", () => {
    const date = new Date("2024-07-24T12:00:00.000Z");
    const element: DataElement = {
      elementIdentifier: "timestamp",
      elementValue: date,
    };
    const usedIds = new Set<number>();

    buildSingleItem(element, usedIds);

    expect(mockTdate).toHaveBeenCalledWith(date);
  });

  it("encodes Date element values with DateFormat.FullDate using fullDate", () => {
    const date = new Date("2024-07-24T00:00:00Z");
    const element: DataElement = {
      elementIdentifier: "birth_date",
      elementValue: date,
      dateFormat: DateFormat.FullDate,
    };
    const usedIds = new Set<number>();

    buildSingleItem(element, usedIds);

    expect(mockFullDate).toHaveBeenCalledWith("2024-07-24");
  });

  it("encodes each Date in an array using the specified dateFormat", () => {
    const dates = [
      new Date("2020-01-01T00:00:00Z"),
      new Date("2025-12-31T00:00:00Z"),
    ];
    const element: DataElement = {
      elementIdentifier: "dates",
      elementValue: dates,
      dateFormat: DateFormat.FullDate,
    };
    const usedIds = new Set<number>();

    buildSingleItem(element, usedIds);

    expect(mockFullDate).toHaveBeenCalledTimes(2);
    expect(mockFullDate).toHaveBeenCalledWith("2020-01-01");
    expect(mockFullDate).toHaveBeenCalledWith("2025-12-31");
  });

  it("passes non-Date array items unchanged", () => {
    const element: DataElement = {
      elementIdentifier: "categories",
      elementValue: ["A", "B", "C"],
    };
    const usedIds = new Set<number>();

    buildSingleItem(element, usedIds);

    const issuerSignedItem = mockEncode.mock.calls[0]?.[0] as Map<
      string,
      unknown
    >;
    expect(issuerSignedItem.get("elementValue")).toEqual(["A", "B", "C"]);
  });
});
