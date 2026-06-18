import { expect, it } from "vitest";
import { helloWorld } from "../../dist/index.js";

it("returns a greeting with the provided name", () => {
  expect(helloWorld("World")).toBe("Hello World!");
});
