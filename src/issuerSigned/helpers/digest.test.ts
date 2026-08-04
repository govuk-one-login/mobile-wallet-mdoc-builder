import { describe, expect, it } from "vitest";
import { digestItem } from "./digest.js";

describe("digestItem", () => {
  it("returns a Uint8Array", async () => {
    const input = new Uint8Array([1, 2, 3, 4]);

    const result = await digestItem(input);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("returns a 32-byte SHA-256 digest", async () => {
    const input = new Uint8Array([10, 20, 30]);

    const result = await digestItem(input);

    expect(result).toHaveLength(32);
  });

  it("produces the correct SHA-256 hash for known input", async () => {
    const input = new Uint8Array([0xd8, 0x18, 0x43, 0xa1, 0x01, 0x02]);

    const result = await digestItem(input);

    // Compute expected hash independently
    const expected = new Uint8Array(
      await crypto.subtle.digest("SHA-256", input),
    );
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
