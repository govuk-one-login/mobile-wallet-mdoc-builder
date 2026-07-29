import { describe, expect, it } from "vitest";
import { decodeAndPadCoordinate } from "./padCoordinate.js";

describe("decodeAndPadCoordinate", () => {
  it("returns a 32-byte coordinate from a 32-byte base64url value", () => {
    const input = Buffer.from(new Uint8Array(32).fill(0xab)).toString(
      "base64url",
    );
    const result = decodeAndPadCoordinate(input);
    expect(result).toHaveLength(32);
    expect(result).toEqual(new Uint8Array(32).fill(0xab));
  });

  it("left-pads a shorter coordinate with zeros to 32 bytes", () => {
    const input = Buffer.from([0x01, 0x02, 0x03]).toString("base64url");
    const result = decodeAndPadCoordinate(input);
    expect(result).toHaveLength(32);
    expect(result.slice(0, 29)).toEqual(new Uint8Array(29));
    expect(result.slice(29)).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
  });

  it("left-pads a 31-byte coordinate with one zero byte", () => {
    const input = Buffer.from(new Uint8Array(31).fill(0xff)).toString(
      "base64url",
    );
    const result = decodeAndPadCoordinate(input);
    expect(result).toHaveLength(32);
    expect(result[0]).toBe(0x00);
    expect(result.slice(1)).toEqual(new Uint8Array(31).fill(0xff));
  });
});
