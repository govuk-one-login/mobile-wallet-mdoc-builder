import { describe, expect, it } from "vitest";
import { buildDeviceKeyInfo } from "./deviceKey.js";
import type { CoseKey } from "./deviceKey.js";
import { MdocBuilderError } from "../types/mdocBuilderError.js";

// Fixed P-256 test vector with known coordinates
const TEST_KEY_P256 = {
  spki: new Uint8Array(
    Buffer.from(
      "3059301306072a8648ce3d020106082a8648ce3d03010703420004c00124f0e54b42c85e4b02e70dab9b0dd5f43f206226db24ada4f9aff1fe07128cbe0a20012191a852441215f90dec09f1905d06f3d58b5bd67422f244a4f308",
      "hex",
    ),
  ),
  x: new Uint8Array(
    Buffer.from(
      "c00124f0e54b42c85e4b02e70dab9b0dd5f43f206226db24ada4f9aff1fe0712",
      "hex",
    ),
  ),
  y: new Uint8Array(
    Buffer.from(
      "8cbe0a20012191a852441215f90dec09f1905d06f3d58b5bd67422f244a4f308",
      "hex",
    ),
  ),
};

const TEST_KEY_P384_SPKI = new Uint8Array(
  Buffer.from(
    "3076301006072a8648ce3d020106052b810400220362000470e3be235cf49069a4ff7f26f3ee4a01c2e540b5432642691bcf2ca9c8558270b3e60e335831c1f6bfe0b912add4d5186beaffa96084d786a3cfb2d09555f7c7c4c79a7722428215202d9be0ecb67d5707709a8aa78b64f804078f2e9a8be63f",
    "hex",
  ),
);

const TEST_KEY_RSA_SPKI = new Uint8Array(
  Buffer.from(
    "30820122300d06092a864886f70d01010105000382010f003082010a0282010100a515859794ac86782555147b8509303495f6103d1cb271f5678a0af8d0c3426611fb5c3e10eb5476d79fbe36c76c5f919bbc3f0cf5e36c8133d3083d08d144936ab1a6b8e49a1ed434f345facc9541a756b84cc6303d164bc4a7fe96997c35f611148a397585ff6abd7d38d104689c12f3c330605a7a6f88769da67310772b8359966b1ffaa008fad9c87ff9379766bf6641330257ae36b79f4552d2cd46725f73cada2dcf3c13753abd22624b2521a72060509ab006a512a75cab6b691c875b7569767dbe8e6618cc7701c0dced543e563f9ec49612ee28e4790eee445afd1bef85f539e6794ee5a3c3e65b1987896c3edbb51a0b883e152a6d270240cf000d0203010001",
    "hex",
  ),
);

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
      expect(() =>
        buildDeviceKeyInfo(TEST_KEY_P384_SPKI, ["org.iso.18013.5.1"]),
      ).toThrow(MdocBuilderError);
      expect(() =>
        buildDeviceKeyInfo(TEST_KEY_P384_SPKI, ["org.iso.18013.5.1"]),
      ).toThrow(/only P-256/i);
    });

    it("throws MdocBuilderError for a non-EC key type", () => {
      expect(() =>
        buildDeviceKeyInfo(TEST_KEY_RSA_SPKI, ["org.iso.18013.5.1"]),
      ).toThrow(MdocBuilderError);
      expect(() =>
        buildDeviceKeyInfo(TEST_KEY_RSA_SPKI, ["org.iso.18013.5.1"]),
      ).toThrow(/unsupported key type/i);
    });
  });

  describe("COSE_Key construction", () => {
    it("contains exactly four entries", () => {
      const result = buildDeviceKeyInfo(TEST_KEY_P256.spki, [
        "org.iso.18013.5.1",
      ]);
      const coseKey = result.get("deviceKey") as CoseKey;
      const keys = [...coseKey.keys()];

      expect(coseKey.size).toBe(4);
      expect(coseKey.get(1)).toBe(2);
      expect(coseKey.get(-1)).toBe(1);
      expect(keys).toEqual([1, -1, -2, -3]);
    });
  });

  describe("coordinate extraction", () => {
    it("extracts coordinates matching the original key", () => {
      const result = buildDeviceKeyInfo(TEST_KEY_P256.spki, [
        "org.iso.18013.5.1",
      ]);
      const coseKey = result.get("deviceKey") as CoseKey;
      expect(coseKey.get(-2)).toEqual(TEST_KEY_P256.x);
      expect(coseKey.get(-3)).toEqual(TEST_KEY_P256.y);
    });
  });

  describe("keyAuthorizations", () => {
    it("includes all provided namespace names", () => {
      const namespaces = ["org.iso.18013.5.1", "org.iso.18013.5.1.GB"];
      const result = buildDeviceKeyInfo(TEST_KEY_P256.spki, namespaces);
      const keyAuth = result.get("keyAuthorizations") as Map<string, string[]>;
      expect(keyAuth.get("nameSpaces")).toEqual(namespaces);
    });

    it("omits keyAuthorizations when namespace list is empty", () => {
      const result = buildDeviceKeyInfo(TEST_KEY_P256.spki, []);
      expect(result.has("keyAuthorizations")).toBe(false);
    });
  });

  describe("DeviceKeyInfo assembly", () => {
    it("preserves insertion order: deviceKey first, keyAuthorizations second", () => {
      const result = buildDeviceKeyInfo(TEST_KEY_P256.spki, [
        "org.iso.18013.5.1",
      ]);
      const keys = [...result.keys()];
      expect(keys).toEqual(["deviceKey", "keyAuthorizations"]);
    });
  });
});
