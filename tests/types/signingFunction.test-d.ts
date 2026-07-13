import { describe, expectTypeOf, it } from "vitest";
import type { SigningFunction } from "../../src";

describe("SigningFunction", () => {
  it("accepts a function taking Uint8Array and returning Promise<Uint8Array>", () => {
    expectTypeOf<
      (toBeSigned: Uint8Array) => Promise<Uint8Array>
    >().toExtend<SigningFunction>();
  });

  it("does not accept a function with wrong parameter type", () => {
    expectTypeOf<
      (toBeSigned: string) => Promise<Uint8Array>
    >().not.toExtend<SigningFunction>();
  });

  it("does not accept a function with wrong return type", () => {
    expectTypeOf<
      (toBeSigned: Uint8Array) => Promise<string>
    >().not.toExtend<SigningFunction>();
  });

  it("does not accept a synchronous function", () => {
    expectTypeOf<
      (toBeSigned: Uint8Array) => Uint8Array
    >().not.toExtend<SigningFunction>();
  });
});
