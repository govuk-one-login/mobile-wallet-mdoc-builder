import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceKeyInfo } from "../deviceKey/index.js";
import type { ValidityInfo } from "../validityInfo/index.js";
import type { StatusList } from "../types/index.js";
import type { MsoInput } from "./buildMso.js";

const mockEncode = vi.fn<(value: unknown) => Uint8Array>();
const mockEmbeddedCbor = vi.fn<(bytes: Uint8Array) => unknown>();
const mockTdate = vi.fn<(date: Date) => unknown>();

vi.mock("../cbor/index.js", () => ({
  encode: (value: unknown) => mockEncode(value),
  embeddedCbor: (bytes: Uint8Array) => mockEmbeddedCbor(bytes),
  tdate: (date: Date) => mockTdate(date),
  fullDate: vi.fn(),
  TaggedValue: class TaggedValue {
    constructor(
      public tagNumber: number,
      public contents: unknown,
    ) {}
  },
}));

const { buildMso } = await import("./buildMso.js");

function makeMsoInput(overrides?: Partial<MsoInput>): MsoInput {
  const coseKey = new Map<number, number | Uint8Array>([
    [1, 2],
    [-1, 1],
    [-2, new Uint8Array(32).fill(0x01)],
    [-3, new Uint8Array(32).fill(0x02)],
  ]);
  const keyAuthorizations = new Map<string, string[]>([
    ["nameSpaces", ["org.iso.18013.5.1"]],
  ]);
  const deviceKeyInfo: DeviceKeyInfo = new Map();
  deviceKeyInfo.set("deviceKey", coseKey);
  deviceKeyInfo.set("keyAuthorizations", keyAuthorizations);

  const validityInfo: ValidityInfo = {
    signed: new Date("2026-07-01T12:00:00Z"),
    validFrom: new Date("2026-07-01T12:00:00Z"),
    validUntil: new Date("2027-07-01T12:00:00Z"),
  };

  const statusList: StatusList = {
    idx: 42,
    uri: "https://example.com/status/1",
  };

  const valueDigests = new Map<string, Map<number, Uint8Array>>([
    [
      "org.iso.18013.5.1",
      new Map<number, Uint8Array>([
        [0, new Uint8Array(32).fill(0xaa)],
        [1, new Uint8Array(32).fill(0xbb)],
      ]),
    ],
  ]);

  return {
    docType: "org.iso.18013.5.1.mDL",
    valueDigests,
    deviceKeyInfo,
    validityInfo,
    statusList,
    ...overrides,
  };
}

describe("buildMso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEncode.mockReturnValue(new Uint8Array([0xca, 0xfe]));
    mockEmbeddedCbor.mockReturnValue({ type: "embedded-cbor" });
    mockTdate.mockImplementation((date: Date) => ({
      type: "tdate",
      date,
    }));
  });

  describe("MSO map structure", () => {
    it("encodes a Map with the correct top-level keys in spec order", () => {
      const input = makeMsoInput();

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      expect(encodedMap).toBeInstanceOf(Map);
      expect([...encodedMap.keys()]).toEqual([
        "version",
        "digestAlgorithm",
        "valueDigests",
        "deviceKeyInfo",
        "validityInfo",
        "status",
        "docType",
      ]);
    });

    it("sets version to '1.0'", () => {
      const input = makeMsoInput();

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      expect(encodedMap.get("version")).toBe("1.0");
    });

    it("sets digestAlgorithm to 'SHA-256'", () => {
      const input = makeMsoInput();

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      expect(encodedMap.get("digestAlgorithm")).toBe("SHA-256");
    });

    it("passes docType from input unchanged", () => {
      const input = makeMsoInput({ docType: "org.iso.18013.5.1.mDL" });

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      expect(encodedMap.get("docType")).toBe("org.iso.18013.5.1.mDL");
    });
  });

  describe("valueDigests", () => {
    it("passes valueDigests from input unchanged", () => {
      const valueDigests = new Map<string, Map<number, Uint8Array>>([
        ["org.iso.18013.5.1", new Map([[7, new Uint8Array(32).fill(0xdd)]])],
      ]);
      const input = makeMsoInput({ valueDigests });

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      expect(encodedMap.get("valueDigests")).toBe(valueDigests);
    });
  });

  describe("deviceKeyInfo", () => {
    it("passes deviceKeyInfo from input unchanged", () => {
      const input = makeMsoInput();

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      expect(encodedMap.get("deviceKeyInfo")).toBe(input.deviceKeyInfo);
    });
  });

  describe("validityInfo", () => {
    it("wraps signed, validFrom, and validUntil dates with tdate", () => {
      const validityInfo: ValidityInfo = {
        signed: new Date("2026-07-01T12:00:00Z"),
        validFrom: new Date("2026-07-01T12:00:00Z"),
        validUntil: new Date("2027-07-01T12:00:00Z"),
      };
      const input = makeMsoInput({ validityInfo });

      buildMso(input);

      expect(mockTdate).toHaveBeenCalledWith(validityInfo.signed);
      expect(mockTdate).toHaveBeenCalledWith(validityInfo.validFrom);
      expect(mockTdate).toHaveBeenCalledWith(validityInfo.validUntil);
    });

    it("wraps expectedUpdate with tdate when present", () => {
      const expectedUpdate = new Date("2026-10-01T12:00:00Z");
      const validityInfo: ValidityInfo = {
        signed: new Date("2026-07-01T12:00:00Z"),
        validFrom: new Date("2026-07-01T12:00:00Z"),
        validUntil: new Date("2027-07-01T12:00:00Z"),
        expectedUpdate,
      };
      const input = makeMsoInput({ validityInfo });

      buildMso(input);

      expect(mockTdate).toHaveBeenCalledWith(expectedUpdate);
    });

    it("does not call tdate for expectedUpdate when absent", () => {
      const validityInfo: ValidityInfo = {
        signed: new Date("2026-07-01T12:00:00Z"),
        validFrom: new Date("2026-07-01T12:00:00Z"),
        validUntil: new Date("2027-07-01T12:00:00Z"),
      };
      const input = makeMsoInput({ validityInfo });

      buildMso(input);

      // Only 3 calls: signed, validFrom, validUntil
      expect(mockTdate).toHaveBeenCalledTimes(3);
    });

    it("produces a validityInfo Map with correct keys", () => {
      const validityInfo: ValidityInfo = {
        signed: new Date("2026-07-01T12:00:00Z"),
        validFrom: new Date("2026-07-01T12:00:00Z"),
        validUntil: new Date("2027-07-01T12:00:00Z"),
        expectedUpdate: new Date("2026-10-01T12:00:00Z"),
      };
      const input = makeMsoInput({ validityInfo });

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      const validityMap = encodedMap.get("validityInfo") as Map<
        string,
        unknown
      >;
      expect(validityMap).toBeInstanceOf(Map);
      expect([...validityMap.keys()]).toEqual([
        "signed",
        "validFrom",
        "validUntil",
        "expectedUpdate",
      ]);
    });

    it("omits expectedUpdate key from validityInfo Map when absent", () => {
      const validityInfo: ValidityInfo = {
        signed: new Date("2026-07-01T12:00:00Z"),
        validFrom: new Date("2026-07-01T12:00:00Z"),
        validUntil: new Date("2027-07-01T12:00:00Z"),
      };
      const input = makeMsoInput({ validityInfo });

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      const validityMap = encodedMap.get("validityInfo") as Map<
        string,
        unknown
      >;
      expect([...validityMap.keys()]).toEqual([
        "signed",
        "validFrom",
        "validUntil",
      ]);
    });
  });

  describe("status", () => {
    it("produces a status Map containing status_list with idx and uri", () => {
      const statusList: StatusList = {
        idx: 99,
        uri: "https://example.com/status/2",
      };
      const input = makeMsoInput({ statusList });

      buildMso(input);

      const encodedMap = mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
      const statusMap = encodedMap.get("status") as Map<string, unknown>;
      expect(statusMap).toBeInstanceOf(Map);
      expect(statusMap.has("status_list")).toBe(true);

      const statusListMap = statusMap.get("status_list") as Map<
        string,
        unknown
      >;
      expect(statusListMap).toBeInstanceOf(Map);
      expect(statusListMap.get("idx")).toBe(99);
      expect(statusListMap.get("uri")).toBe("https://example.com/status/2");
    });
  });

  describe("tag 24 wrapping", () => {
    it("wraps encoded bytes with embeddedCbor", () => {
      const encodedBytes = new Uint8Array([0xde, 0xad]);
      mockEncode.mockReturnValueOnce(encodedBytes);
      const input = makeMsoInput();

      buildMso(input);

      expect(mockEmbeddedCbor).toHaveBeenCalledWith(encodedBytes);
    });

    it("encodes the embeddedCbor result to produce final output", () => {
      const innerBytes = new Uint8Array([0x01, 0x02]);
      const tag24Bytes = new Uint8Array([0xd8, 0x18, 0x42, 0x01, 0x02]);
      const embeddedResult = { type: "embedded-cbor" };

      mockEncode.mockReturnValueOnce(innerBytes); // first call: encode the MSO map
      mockEmbeddedCbor.mockReturnValueOnce(embeddedResult);
      mockEncode.mockReturnValueOnce(tag24Bytes); // second call: encode the tag 24 wrapper

      const input = makeMsoInput();
      const result = buildMso(input);

      expect(result).toBe(tag24Bytes);
    });

    it("returns a Uint8Array", () => {
      const input = makeMsoInput();

      const result = buildMso(input);

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });
});
