import { describe, it, expect } from "vitest";
import { dataElementValueSchema } from "./dataElementValue.js";
import { VALIDATION_LIMITS } from "./constants.js";

const { maxLength } = VALIDATION_LIMITS.collections;

const accepts = (value: unknown) =>
  dataElementValueSchema.safeParse(value).success;

describe("dataElementValueSchema — single primitives", () => {
  it("accepts a string", () => {
    expect(accepts("hello")).toBe(true);
  });

  it("accepts a number", () => {
    expect(accepts(42)).toBe(true);
  });

  it("accepts a boolean", () => {
    expect(accepts(true)).toBe(true);
  });

  it("accepts a valid Date", () => {
    expect(accepts(new Date("2020-01-01"))).toBe(true);
  });

  it("accepts a non-empty Uint8Array", () => {
    expect(accepts(new Uint8Array([1, 2, 3]))).toBe(true);
  });

  it("rejects an invalid primitive (empty string)", () => {
    expect(accepts("")).toBe(false);
  });

  it("rejects an unsupported type (plain object)", () => {
    expect(accepts({})).toBe(false);
  });
});

describe("dataElementValueSchema — primitive arrays", () => {
  it("accepts a homogeneous array of numbers", () => {
    expect(accepts([1, 2, 3])).toBe(true);
  });

  it("accepts a homogeneous array of strings", () => {
    expect(accepts(["a", "b"])).toBe(true);
  });

  it("accepts a homogeneous array of booleans", () => {
    expect(accepts([true, false, true])).toBe(true);
  });

  it("rejects an empty array", () => {
    expect(accepts([])).toBe(false);
  });

  it("rejects a mixed-type array", () => {
    expect(accepts([1, "a"])).toBe(false);
  });

  it("treats Date and string as distinct types", () => {
    expect(accepts([new Date("2020-01-01"), "a"])).toBe(false);
  });

  it("treats Uint8Array and number as distinct types", () => {
    expect(accepts([new Uint8Array([1]), 2])).toBe(false);
  });

  it("accepts a homogeneous array of Dates", () => {
    expect(accepts([new Date("2020-01-01"), new Date("2021-01-01")])).toBe(
      true,
    );
  });

  it("accepts an array at the maximum length", () => {
    expect(accepts(Array.from({ length: maxLength }, (_, i) => i))).toBe(true);
  });

  it("rejects an array over the maximum length", () => {
    expect(accepts(Array.from({ length: maxLength + 1 }, (_, i) => i))).toBe(
      false,
    );
  });
});

describe("dataElementValueSchema — primitive maps", () => {
  it("accepts a homogeneous map of numbers", () => {
    expect(
      accepts(
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
      ),
    ).toBe(true);
  });

  it("rejects an empty map", () => {
    expect(accepts(new Map())).toBe(false);
  });

  it("rejects a map with mixed value types", () => {
    expect(
      accepts(
        new Map<string, unknown>([
          ["a", 1],
          ["b", "two"],
        ]),
      ),
    ).toBe(false);
  });

  it("rejects a map with a non-string (numeric) key", () => {
    expect(accepts(new Map<unknown, unknown>([[1, "x"]]))).toBe(false);
  });

  it("accepts a map at the maximum size", () => {
    const entries = Array.from(
      { length: maxLength },
      (_, i) => [`k${i.toString()}`, i] as [string, number],
    );
    expect(accepts(new Map(entries))).toBe(true);
  });

  it("rejects a map over the maximum size", () => {
    const entries = Array.from(
      { length: maxLength + 1 },
      (_, i) => [`k${i.toString()}`, i] as [string, number],
    );
    expect(accepts(new Map(entries))).toBe(false);
  });
});

describe("dataElementValueSchema — arrays of maps", () => {
  it("accepts an array of homogeneous maps", () => {
    expect(accepts([new Map([["a", 1]]), new Map([["b", 2]])])).toBe(true);
  });

  it("rejects an array containing an empty map", () => {
    // The empty-outer-array case is covered by the primitive-arrays branch;
    // this exercises the arrays-of-maps "each map must not be empty" rule.
    expect(accepts([new Map()])).toBe(false);
  });

  it("rejects when an individual map has mixed value types", () => {
    expect(
      accepts([
        new Map<string, unknown>([
          ["a", 1],
          ["b", "two"],
        ]),
      ]),
    ).toBe(false);
  });

  it("rejects an array containing a map with a non-string (numeric) key", () => {
    expect(accepts([new Map<unknown, unknown>([[1, "x"]])])).toBe(false);
  });

  it("allows different maps to have different (but internally homogeneous) types", () => {
    // Homogeneity is per-map, not across the array.
    expect(accepts([new Map([["a", 1]]), new Map([["b", "two"]])])).toBe(true);
  });

  it("rejects an array of maps over the maximum length", () => {
    const maps = Array.from(
      { length: maxLength + 1 },
      (_, i) => new Map([["k", i]]),
    );
    expect(accepts(maps)).toBe(false);
  });

  it("accepts an array containing a map at the maximum size", () => {
    const entries = Array.from(
      { length: maxLength },
      (_, i) => [`k${i.toString()}`, i] as [string, number],
    );
    expect(accepts([new Map(entries)])).toBe(true);
  });

  it("rejects an array containing a map over the maximum size", () => {
    const entries = Array.from(
      { length: maxLength + 1 },
      (_, i) => [`k${i.toString()}`, i] as [string, number],
    );
    expect(accepts([new Map(entries)])).toBe(false);
  });
});
