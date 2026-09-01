import { describe, it, expect } from "vitest";
import {
  stringValueSchema,
  numberValueSchema,
  booleanValueSchema,
  dateValueSchema,
  uint8ArrayValueSchema,
} from "./primitives.js";
import { VALIDATION_LIMITS } from "./constants.js";

describe("stringValueSchema", () => {
  it("rejects an empty string", () => {
    expect(stringValueSchema.safeParse("").success).toBe(false);
  });

  it("accepts a single-character string", () => {
    expect(stringValueSchema.safeParse("a").success).toBe(true);
  });

  it("accepts a string at the maximum length", () => {
    const atMax = "a".repeat(VALIDATION_LIMITS.elementValue.string.maxLength);
    expect(stringValueSchema.safeParse(atMax).success).toBe(true);
  });

  it("rejects a string over the maximum length", () => {
    const overMax = "a".repeat(
      VALIDATION_LIMITS.elementValue.string.maxLength + 1,
    );
    expect(stringValueSchema.safeParse(overMax).success).toBe(false);
  });
});

describe("numberValueSchema", () => {
  it("rejects NaN", () => {
    expect(numberValueSchema.safeParse(NaN).success).toBe(false);
  });

  it("rejects Infinity", () => {
    expect(numberValueSchema.safeParse(Infinity).success).toBe(false);
  });

  it("rejects -Infinity", () => {
    expect(numberValueSchema.safeParse(-Infinity).success).toBe(false);
  });

  it("accepts a float", () => {
    expect(numberValueSchema.safeParse(3.14).success).toBe(true);
  });

  it("accepts an integer", () => {
    expect(numberValueSchema.safeParse(42).success).toBe(true);
  });

  it("accepts the minimum safe integer", () => {
    expect(
      numberValueSchema.safeParse(VALIDATION_LIMITS.elementValue.number.min)
        .success,
    ).toBe(true);
  });

  it("accepts the maximum safe integer", () => {
    expect(
      numberValueSchema.safeParse(VALIDATION_LIMITS.elementValue.number.max)
        .success,
    ).toBe(true);
  });

  it("rejects a value below the minimum", () => {
    expect(
      numberValueSchema.safeParse(VALIDATION_LIMITS.elementValue.number.min - 1)
        .success,
    ).toBe(false);
  });

  it("rejects a value above the maximum", () => {
    expect(
      numberValueSchema.safeParse(VALIDATION_LIMITS.elementValue.number.max + 1)
        .success,
    ).toBe(false);
  });
});

describe("booleanValueSchema", () => {
  it("accepts true", () => {
    expect(booleanValueSchema.safeParse(true).success).toBe(true);
  });

  it("accepts false", () => {
    expect(booleanValueSchema.safeParse(false).success).toBe(true);
  });

  it("rejects a non-boolean", () => {
    expect(booleanValueSchema.safeParse("true").success).toBe(false);
  });
});

describe("dateValueSchema", () => {
  it("accepts a valid Date", () => {
    expect(dateValueSchema.safeParse(new Date("2020-01-01")).success).toBe(
      true,
    );
  });

  it("rejects an Invalid Date", () => {
    expect(dateValueSchema.safeParse(new Date("not-a-date")).success).toBe(
      false,
    );
  });

  it("rejects a non-Date value", () => {
    expect(dateValueSchema.safeParse("2020-01-01").success).toBe(false);
  });
});

describe("uint8ArrayValueSchema", () => {
  it("rejects an empty Uint8Array", () => {
    expect(uint8ArrayValueSchema.safeParse(new Uint8Array([])).success).toBe(
      false,
    );
  });

  it("accepts a single-byte Uint8Array", () => {
    expect(uint8ArrayValueSchema.safeParse(new Uint8Array([1])).success).toBe(
      true,
    );
  });

  it("accepts a Uint8Array at the maximum byte length", () => {
    const atMax = new Uint8Array(
      VALIDATION_LIMITS.elementValue.uint8Array.maxByteLength,
    );
    expect(uint8ArrayValueSchema.safeParse(atMax).success).toBe(true);
  });

  it("rejects a Uint8Array over the maximum byte length", () => {
    const overMax = new Uint8Array(
      VALIDATION_LIMITS.elementValue.uint8Array.maxByteLength + 1,
    );
    expect(uint8ArrayValueSchema.safeParse(overMax).success).toBe(false);
  });

  it("rejects a non-Uint8Array value", () => {
    expect(uint8ArrayValueSchema.safeParse([1, 2, 3]).success).toBe(false);
  });
});
