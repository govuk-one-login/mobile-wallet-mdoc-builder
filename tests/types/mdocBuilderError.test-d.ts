import { describe, expectTypeOf, it } from "vitest";
import type { MdocBuilderError } from "../../src";
import type { ValidationError } from "../../src";

describe("MdocBuilderError", () => {
  it("exposes an optional violations array of ValidationError", () => {
    expectTypeOf<MdocBuilderError["violations"]>().toEqualTypeOf<
      ValidationError[] | undefined
    >();
  });
});
