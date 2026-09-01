import { describe, it, expect, expectTypeOf } from "vitest";
import { VALIDATION_LIMITS } from "./constants.js";

describe("VALIDATION_LIMITS", () => {
  it("mirrors documentType rules", () => {
    expect(VALIDATION_LIMITS.documentType).toEqual({
      minLength: 1,
      maxLength: 128,
    });
  });

  it("mirrors nameSpaces rules", () => {
    expect(VALIDATION_LIMITS.nameSpaces).toEqual({
      namespaceKey: { minLength: 1, maxLength: 256 },
      minDataElements: 1,
      maxDataElements: 256,
      elementIdentifier: { minLength: 1, maxLength: 256 },
    });
  });

  it("mirrors primitive element value rules", () => {
    expect(VALIDATION_LIMITS.elementValue).toEqual({
      string: { minLength: 1, maxLength: 150 },
      number: {
        min: -9007199254740991,
        max: 9007199254740991,
      },
      uint8Array: { minByteLength: 1, maxByteLength: 1572864 },
    });
  });

  it("mirrors collection rules", () => {
    expect(VALIDATION_LIMITS.collections).toEqual({
      minLength: 1,
      maxLength: 256,
    });
  });

  it("mirrors deviceKey rules", () => {
    expect(VALIDATION_LIMITS.deviceKey).toEqual({
      minByteLength: 1,
      maxByteLength: 2048,
    });
  });

  it("mirrors statusList rules", () => {
    expect(VALIDATION_LIMITS.statusList).toEqual({
      idx: { min: 0, max: 4294967295 },
      uri: { maxLength: 2048 },
    });
  });

  it("mirrors certificateChain rules", () => {
    expect(VALIDATION_LIMITS.certificateChain).toEqual({
      minLength: 1,
      entry: { minByteLength: 1, maxByteLength: 8192 },
    });
  });

  it("exposes number bounds as the safe-integer limits", () => {
    expect(VALIDATION_LIMITS.elementValue.number.min).toBe(
      Number.MIN_SAFE_INTEGER,
    );
    expect(VALIDATION_LIMITS.elementValue.number.max).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });

  it("is a deeply-readonly literal-typed object", () => {
    expectTypeOf(VALIDATION_LIMITS.documentType.maxLength).toEqualTypeOf<128>();
    expectTypeOf(
      VALIDATION_LIMITS.statusList.idx.max,
    ).toEqualTypeOf<4294967295>();
  });
});
