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

  it("produces entries for each namespace in both output maps", async () => {
    const nameSpaces = makeNameSpaces([
      [
        "org.iso.18013.5.1",
        [{ elementIdentifier: "family_name", elementValue: "Smith" }],
      ],
      [
        "uk.gov.wallet.1",
        [{ elementIdentifier: "issuing_country", elementValue: "UK" }],
      ],
    ]);

    const result = await buildIssuerSignedItems(nameSpaces);

    expect(result.issuerSignedItemBytes.size).toBe(2);
    expect(result.valueDigests.size).toBe(2);
    expect(result.issuerSignedItemBytes.has("org.iso.18013.5.1")).toBe(true);
    expect(result.issuerSignedItemBytes.has("uk.gov.wallet.1")).toBe(true);
    expect(result.valueDigests.has("org.iso.18013.5.1")).toBe(true);
    expect(result.valueDigests.has("uk.gov.wallet.1")).toBe(true);
  });

  it("produces correct count of items per namespace", async () => {
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

  it("handles empty namespace", async () => {
    const nameSpaces = makeNameSpaces([["org.iso.18013.5.1", []]]);

    const result = await buildIssuerSignedItems(nameSpaces);

    const items = result.issuerSignedItemBytes.get("org.iso.18013.5.1");
    const digests = result.valueDigests.get("org.iso.18013.5.1");
    expect(items).toHaveLength(0);
    expect(digests?.size).toBe(0);
  });

  it("each namespace gets an independent ID space", async () => {
    const nameSpaces = makeNameSpaces([
      ["ns1", [{ elementIdentifier: "a", elementValue: "1" }]],
      ["ns2", [{ elementIdentifier: "b", elementValue: "2" }]],
    ]);

    const result = await buildIssuerSignedItems(nameSpaces);

    expect(result.valueDigests.get("ns1")?.size).toBe(1);
    expect(result.valueDigests.get("ns2")?.size).toBe(1);
  });

  it("stored digest matches SHA-256 of the corresponding tag24Bytes", async () => {
    const nameSpaces = makeNameSpaces([
      ["ns", [{ elementIdentifier: "name", elementValue: "test" }]],
    ]);

    const result = await buildIssuerSignedItems(nameSpaces);

    const items = result.issuerSignedItemBytes.get("ns");
    const tag24Bytes = items?.[0];
    expect(tag24Bytes).toBeDefined();

    const digests = result.valueDigests.get("ns");
    const storedDigest = [...(digests?.values() ?? [])][0];

    const expectedDigest = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        tag24Bytes as Uint8Array<ArrayBuffer>,
      ),
    );

    expect(storedDigest).toEqual(expectedDigest);
  });
});
