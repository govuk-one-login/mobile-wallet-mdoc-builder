import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildDeviceKeyInfo, padCoordinate } from "./deviceKey.js";
import { MdocBuilderError } from "../types/mdocBuilderError.js";

function generateSpki(namedCurve: string): Uint8Array {
  const { publicKey } = crypto.generateKeyPairSync("ec", { namedCurve });
  const der = publicKey.export({ format: "der", type: "spki" });
  return new Uint8Array(der);
}

function getExpectedCoordinates(spki: Uint8Array): {
  x: Uint8Array;
  y: Uint8Array;
} {
  const keyObject = crypto.createPublicKey({
    key: Buffer.from(spki),
    format: "der",
    type: "spki",
  });
  const jwk = keyObject.export({ format: "jwk" });
  const x = Buffer.from(jwk.x ?? "", "base64url");
  const y = Buffer.from(jwk.y ?? "", "base64url");
  return { x: new Uint8Array(x), y: new Uint8Array(y) };
}

describe("buildDeviceKeyInfo", () => {
  describe("SPKI import validation", () => {
    it("throws MdocBuilderError for invalid bytes", () => {
      const garbage = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
      expect(() => buildDeviceKeyInfo(garbage, ["org.iso.18013.5.1"])).toThrow(
        MdocBuilderError,
      );
      expect(() => buildDeviceKeyInfo(garbage, ["org.iso.18013.5.1"])).toThrow(
        /failed to import SPKI/i,
      );
    });

    it("throws MdocBuilderError for a non-P-256 curve", () => {
      const spki = generateSpki("P-384");
      expect(() => buildDeviceKeyInfo(spki, ["org.iso.18013.5.1"])).toThrow(
        MdocBuilderError,
      );
      expect(() => buildDeviceKeyInfo(spki, ["org.iso.18013.5.1"])).toThrow(
        /only P-256/i,
      );
    });
  });

  describe("COSE_Key construction", () => {
    it("contains exactly four entries", () => {
      const spki = generateSpki("P-256");
      const result = buildDeviceKeyInfo(spki, ["org.iso.18013.5.1"]);
      const coseKey = result.get("deviceKey") as Map<number, unknown>;
      const keys = [...coseKey.keys()];

      expect(coseKey.size).toBe(4);
      expect(coseKey.get(1)).toBe(2);
      expect(coseKey.get(-1)).toBe(1);
      expect(keys).toEqual([1, -1, -2, -3]);
    });
  });

  describe("coordinate extraction", () => {
    it("extracts coordinates matching the original key", () => {
      const spki = generateSpki("P-256");
      const expected = getExpectedCoordinates(spki);
      const result = buildDeviceKeyInfo(spki, ["org.iso.18013.5.1"]);
      const coseKey = result.get("deviceKey") as Map<number, unknown>;
      expect(coseKey.get(-2)).toEqual(expected.x);
      expect(coseKey.get(-3)).toEqual(expected.y);
    });
  });

  describe("keyAuthorizations", () => {
    it("includes all provided namespace names", () => {
      const spki = generateSpki("P-256");
      const namespaces = ["org.iso.18013.5.1", "org.iso.18013.5.1.GB"];
      const result = buildDeviceKeyInfo(spki, namespaces);
      const keyAuth = result.get("keyAuthorizations") as Map<string, unknown>;
      expect(keyAuth.get("nameSpaces")).toEqual(namespaces);
    });

    it("omits keyAuthorizations when namespace list is empty", () => {
      const spki = generateSpki("P-256");
      const result = buildDeviceKeyInfo(spki, []);
      expect(result.has("keyAuthorizations")).toBe(false);
    });
  });

  describe("DeviceKeyInfo assembly", () => {
    it("preserves insertion order: deviceKey first, keyAuthorizations second", () => {
      const spki = generateSpki("P-256");
      const result = buildDeviceKeyInfo(spki, ["org.iso.18013.5.1"]);
      const keys = [...result.keys()];
      expect(keys).toEqual(["deviceKey", "keyAuthorizations"]);
    });
  });
});

describe("padCoordinate", () => {
  it("returns the coordinate unchanged when it is already 32 bytes", () => {
    const input = new Uint8Array(32).fill(0xab);
    const result = padCoordinate(input);
    expect(result).toEqual(input);
    expect(result).toHaveLength(32);
  });

  it("left-pads a shorter coordinate with zeros to 32 bytes", () => {
    const input = new Uint8Array([0x01, 0x02, 0x03]);
    const result = padCoordinate(input);
    expect(result).toHaveLength(32);
    expect(result.slice(0, 29)).toEqual(new Uint8Array(29));
    expect(result.slice(29)).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
  });

  it("left-pads a 31-byte coordinate with one zero byte", () => {
    const input = new Uint8Array(31).fill(0xff);
    const result = padCoordinate(input);
    expect(result).toHaveLength(32);
    expect(result[0]).toBe(0x00);
    expect(result.slice(1)).toEqual(new Uint8Array(31).fill(0xff));
  });
});
