import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildDeviceKeyInfo } from "./deviceKey.js";
import { MdocBuilderError } from "../types/mdocBuilderError.js";

function generateSpki(namedCurve: string): Uint8Array {
  const { publicKey } = crypto.generateKeyPairSync("ec", { namedCurve });
  const der = publicKey.export({ format: "der", type: "spki" });
  return new Uint8Array(der);
}

describe("buildDeviceKeyInfo", () => {
  describe("SPKI import validation", () => {
    it("does not throw for a valid P-256 SPKI key", () => {
      const spki = generateSpki("P-256");
      expect(() =>
        buildDeviceKeyInfo(spki, ["org.iso.18013.5.1"]),
      ).not.toThrow();
    });

    it("throws MdocBuilderError for an empty Uint8Array", () => {
      expect(() =>
        buildDeviceKeyInfo(new Uint8Array(0), ["org.iso.18013.5.1"]),
      ).toThrow(MdocBuilderError);

      expect(() =>
        buildDeviceKeyInfo(new Uint8Array(0), ["org.iso.18013.5.1"]),
      ).toThrow(/failed to import SPKI/i);
    });

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
});
