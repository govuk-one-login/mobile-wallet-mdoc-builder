import { describe, it, expect } from "vitest";
import { MdocOutput } from "./mdoc.js";
import { hexToBytes } from "../test-helpers/hexToBytes.js";

describe("MdocOutput", () => {
  const bytes = new Uint8Array([0x01, 0x02, 0x03, 0xff]);

  describe("asBytes", () => {
    it("returns the bytes passed to the constructor", () => {
      const mdoc = new MdocOutput(bytes);

      expect(mdoc.asBytes()).toBe(bytes);
    });

    it("returns an empty Uint8Array for empty input", () => {
      const mdoc = new MdocOutput(new Uint8Array([]));

      expect(mdoc.asBytes()).toEqual(new Uint8Array([]));
    });
  });

  describe("asHex", () => {
    it("returns a lowercase hex string", () => {
      const mdoc = new MdocOutput(bytes);

      expect(mdoc.asHex()).toBe("010203ff");
    });

    it("returns an empty string for empty input", () => {
      const mdoc = new MdocOutput(new Uint8Array([]));

      expect(mdoc.asHex()).toBe("");
    });
  });

  describe("asBase64Url", () => {
    it("returns an unpadded base64url string", () => {
      const mdoc = new MdocOutput(bytes);

      expect(mdoc.asBase64Url()).toBe("AQID_w");
    });

    it("uses the URL-safe alphabet (- and _) with no padding", () => {
      // Bytes chosen to produce '+' and '/' in standard base64 (">?" -> "Pj8/... ").
      // 0xfb 0xff 0xbf 0xfe encodes to "+/++" in standard base64.
      const mdoc = new MdocOutput(new Uint8Array([0xfb, 0xff, 0xbf, 0xfe]));

      const result = mdoc.asBase64Url();

      expect(result).not.toContain("+");
      expect(result).not.toContain("/");
      expect(result).not.toContain("=");
      expect(result).toBe("-_-__g");
    });

    it("returns an empty string for empty input", () => {
      const mdoc = new MdocOutput(new Uint8Array([]));

      expect(mdoc.asBase64Url()).toBe("");
    });
  });

  describe("consistency across representations", () => {
    it("all three methods represent the same underlying bytes", () => {
      const mdoc = new MdocOutput(bytes);

      const fromHex = hexToBytes(mdoc.asHex());
      const fromBase64Url = new Uint8Array(
        Buffer.from(mdoc.asBase64Url(), "base64url"),
      );

      expect(fromHex).toEqual(mdoc.asBytes());
      expect(fromBase64Url).toEqual(mdoc.asBytes());
    });
  });
});
