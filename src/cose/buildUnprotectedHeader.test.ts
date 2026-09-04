import { describe, expect, it } from "vitest";
import { MdocBuilderError } from "../types";
import { buildUnprotectedHeader } from "./buildUnprotectedHeader.js";

describe("buildUnprotectedHeader", () => {
  it("builds a map with x5chain (33) set to the first certificate as a bstr", () => {
    const cert0 = new Uint8Array([0x01, 0x02, 0x03]);

    const result = buildUnprotectedHeader([cert0]);

    expect(result).toBeInstanceOf(Map);
    expect(result).toEqual(new Map<number, Uint8Array>([[33, cert0]]));
    expect(result.get(33)).toBe(cert0);
  });

  it("uses only the first certificate when the chain contains multiple", () => {
    const cert0 = new Uint8Array([0x01, 0x02, 0x03]);
    const cert1 = new Uint8Array([0x04, 0x05, 0x06]);

    const result = buildUnprotectedHeader([cert0, cert1]);

    expect(result).toEqual(new Map<number, Uint8Array>([[33, cert0]]));
    expect(result.get(33)).toBe(cert0);
  });

  it("throws MdocBuilderError when the certificate chain is empty", () => {
    expect(() => buildUnprotectedHeader([])).toThrow(MdocBuilderError);
    expect(() => buildUnprotectedHeader([])).toThrow(
      /certificate chain is empty/i,
    );
  });
});
