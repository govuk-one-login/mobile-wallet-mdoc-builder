import { describe, expectTypeOf, it } from "vitest";
import type { ValidationError } from "../../src";

describe("ValidationError", () => {
  it("exposes field and message strings", () => {
    expectTypeOf<ValidationError>().toEqualTypeOf<{
      field: string;
      message: string;
    }>();
  });
});
