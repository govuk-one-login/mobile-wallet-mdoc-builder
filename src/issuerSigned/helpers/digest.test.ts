import { describe, expect, it } from "vitest";
import { digestItem } from "./digest.js";

describe("digestItem", () => {
  it("returns a 32-byte SHA-256 digest", async () => {
    const input = new Uint8Array([10, 20, 30]);

    const result = await digestItem(input);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
  });

  it("produces the correct SHA-256 hash for known input", async () => {
    const input = new Uint8Array([0x01, 0x02, 0x03]);

    const result = await digestItem(input);

    // SHA-256 of [0x01, 0x02, 0x03] — derived externally via shasum
    const expected = new Uint8Array([
      0x03, 0x90, 0x58, 0xc6, 0xf2, 0xc0, 0xcb, 0x49, 0x2c, 0x53, 0x3b, 0x0a,
      0x4d, 0x14, 0xef, 0x77, 0xcc, 0x0f, 0x78, 0xab, 0xcc, 0xce, 0xd5, 0x28,
      0x7d, 0x84, 0xa1, 0xa2, 0x01, 0x1c, 0xfb, 0x81,
    ]);
    expect(result).toEqual(expected);
  });

  it("produces different digests for different inputs", async () => {
    const input1 = new Uint8Array([1, 2, 3]);
    const input2 = new Uint8Array([4, 5, 6]);

    const result1 = await digestItem(input1);
    const result2 = await digestItem(input2);

    expect(result1).not.toEqual(result2);
  });

  it("produces the same digest for the same input", async () => {
    const input = new Uint8Array([7, 8, 9]);

    const result1 = await digestItem(input);
    const result2 = await digestItem(input);

    expect(result1).toEqual(result2);
  });
});
