import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IssuerAuth } from "../issuerAuth";

const mockEncode = vi.fn<(value: unknown) => Uint8Array>();
const mockEmbeddedCbor = vi.fn<(bytes: Uint8Array) => unknown>();

vi.mock("../cbor/index.js", () => ({
  encode: (value: unknown) => mockEncode(value),
  embeddedCbor: (bytes: Uint8Array) => mockEmbeddedCbor(bytes),
}));

const { assembleIssuerSigned } = await import("./assembleIssuerSigned.js");

function makeIssuerAuth(): IssuerAuth {
  return [
    new Uint8Array([0xa1, 0x01, 0x26]), // protected header
    new Map<number, Uint8Array>([[33, new Uint8Array([0xde, 0xad])]]), // unprotected
    new Uint8Array([0xd8, 0x18, 0x41, 0x00]), // MSO bytes (Tag 24)
    new Uint8Array(64).fill(0x11), // signature
  ];
}

function getEncodedMap(): Map<string, unknown> {
  return mockEncode.mock.calls[0]?.[0] as Map<string, unknown>;
}

describe("assembleIssuerSigned", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEncode.mockReturnValue(new Uint8Array([0xca, 0xfe]));
    mockEmbeddedCbor.mockImplementation((bytes: Uint8Array) => ({
      type: "embedded-cbor",
      bytes,
    }));
  });

  describe("IssuerSigned map structure", () => {
    it("encodes a Map with keys nameSpaces then issuerAuth in spec order", () => {
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", [new Uint8Array([0x01])]],
      ]);

      assembleIssuerSigned(nameSpaces, makeIssuerAuth());

      const map = getEncodedMap();
      expect(map).toBeInstanceOf(Map);
      expect([...map.keys()]).toEqual(["nameSpaces", "issuerAuth"]);
    });

    it("passes issuerAuth through unchanged", () => {
      const issuerAuth = makeIssuerAuth();
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", [new Uint8Array([0x01])]],
      ]);

      assembleIssuerSigned(nameSpaces, issuerAuth);

      expect(getEncodedMap().get("issuerAuth")).toBe(issuerAuth);
    });

    it("returns the result of encode()", () => {
      const encoded = new Uint8Array([0x11, 0x22, 0x33]);
      mockEncode.mockReturnValueOnce(encoded);
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", [new Uint8Array([0x01])]],
      ]);

      const result = assembleIssuerSigned(nameSpaces, makeIssuerAuth());

      expect(result).toBe(encoded);
    });

    it("returns a Uint8Array", () => {
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", [new Uint8Array([0x01])]],
      ]);

      const result = assembleIssuerSigned(nameSpaces, makeIssuerAuth());

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe("nameSpaces", () => {
    it("wraps every inner item byte array with embeddedCbor", () => {
      const itemA = new Uint8Array([0x01]);
      const itemB = new Uint8Array([0x02]);
      const itemC = new Uint8Array([0x03]);
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", [itemA, itemB]],
        ["uk.gov.wallet.1", [itemC]],
      ]);

      assembleIssuerSigned(nameSpaces, makeIssuerAuth());

      expect(mockEmbeddedCbor).toHaveBeenCalledTimes(3);
      expect(mockEmbeddedCbor).toHaveBeenCalledWith(itemA);
      expect(mockEmbeddedCbor).toHaveBeenCalledWith(itemB);
      expect(mockEmbeddedCbor).toHaveBeenCalledWith(itemC);
    });

    it("produces a nameSpaces Map preserving namespace insertion order", () => {
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", [new Uint8Array([0x01])]],
        ["uk.gov.wallet.1", [new Uint8Array([0x02])]],
      ]);

      assembleIssuerSigned(nameSpaces, makeIssuerAuth());

      const nsMap = getEncodedMap().get("nameSpaces") as Map<string, unknown[]>;
      expect(nsMap).toBeInstanceOf(Map);
      expect([...nsMap.keys()]).toEqual([
        "org.iso.18013.5.1",
        "uk.gov.wallet.1",
      ]);
    });

    it("maps each namespace to an array of embeddedCbor-wrapped items", () => {
      const itemA = new Uint8Array([0x01]);
      const itemB = new Uint8Array([0x02]);
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", [itemA, itemB]],
      ]);

      assembleIssuerSigned(nameSpaces, makeIssuerAuth());

      const nsMap = getEncodedMap().get("nameSpaces") as Map<string, unknown[]>;
      const items = nsMap.get("org.iso.18013.5.1");
      expect(items).toEqual([
        { type: "embedded-cbor", bytes: itemA },
        { type: "embedded-cbor", bytes: itemB },
      ]);
    });

    it("produces an empty item array for a namespace with no items", () => {
      const nameSpaces = new Map<string, Uint8Array[]>([
        ["org.iso.18013.5.1", []],
      ]);

      assembleIssuerSigned(nameSpaces, makeIssuerAuth());

      const nsMap = getEncodedMap().get("nameSpaces") as Map<string, unknown[]>;
      expect(nsMap.get("org.iso.18013.5.1")).toEqual([]);
      expect(mockEmbeddedCbor).not.toHaveBeenCalled();
    });
  });
});
