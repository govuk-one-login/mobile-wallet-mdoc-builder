import { describe, expectTypeOf, it } from "vitest";
import { buildMdoc } from "../../src/index.js";
import type {
  Mdoc,
  MdocBuilderInput,
  SigningFunction,
} from "../../src/index.js";

describe("buildMdoc", () => {
  it("returns Promise<Mdoc>", () => {
    expectTypeOf(buildMdoc).returns.toExtend<Promise<Mdoc>>();
  });

  it("accepts MdocBuilderInput as first parameter", () => {
    expectTypeOf(buildMdoc).parameter(0).toExtend<MdocBuilderInput>();
  });

  it("accepts SigningFunction as second parameter", () => {
    expectTypeOf(buildMdoc).parameter(1).toExtend<SigningFunction>();
  });
});
