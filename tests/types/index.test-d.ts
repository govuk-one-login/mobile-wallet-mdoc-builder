import { describe, expectTypeOf, it } from "vitest";
import { helloWorld } from "../../src/index.js";

describe("helloWorld", () => {
  it("accepts a string parameter and returns a string", () => {
    expectTypeOf(helloWorld).parameter(0).toBeString();
    expectTypeOf(helloWorld).returns.toBeString();
  });
});
