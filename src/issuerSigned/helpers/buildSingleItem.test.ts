import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataElement } from "../../types";
import { DateFormat } from "../../types";

const mockEncode = vi.fn<(value: unknown) => Uint8Array>();
const mockEmbeddedCbor = vi.fn<(bytes: Uint8Array) => unknown>();
const mockTdate = vi.fn<(date: Date) => unknown>();
const mockFullDate = vi.fn<(date: string) => unknown>();

vi.mock("../../cbor/index.js", () => ({
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

const { buildSingleItem } = await import("./buildSingleItem.js");

function getEncodedMap(): Map<string, unknown> {
  return mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
}

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

  describe("structure", () => {
    it("returns a digestId and tag24Bytes", () => {
      const element: DataElement = {
        elementIdentifier: "family_name",
        elementValue: "Smith",
      };

      const result = buildSingleItem(element, new Set<number>());

      expect(typeof result.digestId).toBe("number");
      expect(result.tag24Bytes).toBeInstanceOf(Uint8Array);
    });

    it("encodes the IssuerSignedItem map with correct field order", () => {
      const element: DataElement = {
        elementIdentifier: "given_name",
        elementValue: "Alice",
      };

      buildSingleItem(element, new Set<number>());

      const map = getEncodedMap();
      expect([...map.keys()]).toEqual([
        "digestID",
        "random",
        "elementIdentifier",
        "elementValue",
      ]);
      expect(map.get("elementIdentifier")).toBe("given_name");
      expect(map.get("elementValue")).toBe("Alice");
    });

    it("generates a 16-byte random salt", () => {
      const element: DataElement = {
        elementIdentifier: "name",
        elementValue: "test",
      };

      buildSingleItem(element, new Set<number>());

      const salt = getEncodedMap().get("random") as Uint8Array;
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt).toHaveLength(16);
    });

    it("wraps encoded bytes with embeddedCbor and encodes the result", () => {
      const element: DataElement = {
        elementIdentifier: "name",
        elementValue: "test",
      };

      buildSingleItem(element, new Set<number>());

      expect(mockEmbeddedCbor).toHaveBeenCalledWith(
        mockEncode.mock.results[0]?.value,
      );
      expect(mockEncode).toHaveBeenCalledTimes(2);
    });
  });

  describe("digestId generation", () => {
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
      const usedIds = new Set<number>();
      for (let i = 0; i < 100; i++) {
        usedIds.add(i);
      }

      const result = buildSingleItem(element, usedIds);

      expect(result.digestId).toBeGreaterThanOrEqual(0);
      expect(result.digestId).toBeLessThanOrEqual(2_147_483_647);
      expect(usedIds.has(result.digestId)).toBe(true);
    });
  });

  describe("elementValue encoding — Date dispatch", () => {
    it("encodes a Date with no dateFormat using tdate (Tag 0)", () => {
      const date = new Date("2024-07-24T12:00:00.000Z");
      const element: DataElement = {
        elementIdentifier: "timestamp",
        elementValue: date,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockTdate).toHaveBeenCalledWith(date);
      expect(mockFullDate).not.toHaveBeenCalled();
    });

    it("encodes a Date with DateFormat.DateTime using tdate (Tag 0)", () => {
      const date = new Date("2024-07-24T12:00:00.000Z");
      const element: DataElement = {
        elementIdentifier: "timestamp",
        elementValue: date,
        dateFormat: DateFormat.DateTime,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockTdate).toHaveBeenCalledWith(date);
      expect(mockFullDate).not.toHaveBeenCalled();
    });

    it("encodes a Date with DateFormat.FullDate using fullDate (Tag 1004)", () => {
      const date = new Date("2024-07-24T00:00:00Z");
      const element: DataElement = {
        elementIdentifier: "birth_date",
        elementValue: date,
        dateFormat: DateFormat.FullDate,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockFullDate).toHaveBeenCalledWith("2024-07-24");
      expect(mockTdate).not.toHaveBeenCalled();
    });
  });

  describe("elementValue encoding — arrays", () => {
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

      buildSingleItem(element, new Set<number>());

      expect(mockFullDate).toHaveBeenCalledTimes(2);
      expect(mockFullDate).toHaveBeenCalledWith("2020-01-01");
      expect(mockFullDate).toHaveBeenCalledWith("2025-12-31");
    });

    it("passes non-Date array items unchanged", () => {
      const element: DataElement = {
        elementIdentifier: "categories",
        elementValue: ["A", "B", "C"],
      };

      buildSingleItem(element, new Set<number>());

      expect(getEncodedMap().get("elementValue")).toEqual(["A", "B", "C"]);
    });

    it("handles mixed Dates and non-Dates in an array", () => {
      const date = new Date("2024-06-15T00:00:00Z");
      const element: DataElement = {
        elementIdentifier: "mixed",
        elementValue: [date, "hello", date],
        dateFormat: DateFormat.FullDate,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockFullDate).toHaveBeenCalledTimes(2);
      expect(mockFullDate).toHaveBeenCalledWith("2024-06-15");
      const encoded = getEncodedMap().get("elementValue") as unknown[];
      expect(encoded[1]).toBe("hello");
    });

    it("handles an array of Maps with Date values", () => {
      const date = new Date("2024-03-01T00:00:00Z");
      const maps = [
        new Map<string, string | Date>([
          ["city", "London"],
          ["moved_on", date],
        ]),
      ];
      const element: DataElement = {
        elementIdentifier: "addresses",
        elementValue: maps,
        dateFormat: DateFormat.FullDate,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockFullDate).toHaveBeenCalledWith("2024-03-01");
      const encoded = getEncodedMap().get("elementValue") as Map<
        string,
        unknown
      >[];
      expect(encoded[0]?.get("city")).toBe("London");
    });
  });

  describe("elementValue encoding — Maps", () => {
    it("tags Date values inside a Map using tdate", () => {
      const date = new Date("2024-01-15T10:00:00Z");
      const map = new Map<string, string | Date>([
        ["name", "Alice"],
        ["valid_from", date],
      ]);
      const element: DataElement = {
        elementIdentifier: "details",
        elementValue: map,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockTdate).toHaveBeenCalledWith(date);
      const encoded = getEncodedMap().get("elementValue") as Map<
        string,
        unknown
      >;
      expect(encoded.get("name")).toBe("Alice");
    });

    it("tags Date values inside a Map using fullDate when specified", () => {
      const date = new Date("2024-01-15T00:00:00Z");
      const map = new Map<string, string | Date>([
        ["country", "UK"],
        ["issue_date", date],
      ]);
      const element: DataElement = {
        elementIdentifier: "metadata",
        elementValue: map,
        dateFormat: DateFormat.FullDate,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockFullDate).toHaveBeenCalledWith("2024-01-15");
      const encoded = getEncodedMap().get("elementValue") as Map<
        string,
        unknown
      >;
      expect(encoded.get("country")).toBe("UK");
    });

    it("passes Map with no Date values unchanged", () => {
      const map = new Map<string, string | number>([
        ["city", "London"],
        ["postcode", 12345],
      ]);
      const element: DataElement = {
        elementIdentifier: "address",
        elementValue: map,
      };

      buildSingleItem(element, new Set<number>());

      expect(mockTdate).not.toHaveBeenCalled();
      expect(mockFullDate).not.toHaveBeenCalled();
      const encoded = getEncodedMap().get("elementValue") as Map<
        string,
        unknown
      >;
      expect(encoded.get("city")).toBe("London");
      expect(encoded.get("postcode")).toBe(12345);
    });
  });

  describe("elementValue encoding — primitives passthrough", () => {
    it("passes boolean values unchanged", () => {
      const element: DataElement = {
        elementIdentifier: "age_over_18",
        elementValue: true,
      };

      buildSingleItem(element, new Set<number>());

      expect(getEncodedMap().get("elementValue")).toBe(true);
    });

    it("passes number values unchanged", () => {
      const element: DataElement = {
        elementIdentifier: "age_in_years",
        elementValue: 30,
      };

      buildSingleItem(element, new Set<number>());

      expect(getEncodedMap().get("elementValue")).toBe(30);
    });

    it("passes Uint8Array values unchanged", () => {
      const bytes = new Uint8Array([0x01, 0x02, 0x03]);
      const element: DataElement = {
        elementIdentifier: "portrait",
        elementValue: bytes,
      };

      buildSingleItem(element, new Set<number>());

      expect(getEncodedMap().get("elementValue")).toBe(bytes);
    });
  });
});
