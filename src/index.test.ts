import { describe, expect, it } from "vitest";
import { helloWorld } from "./index.js";

describe("helloWorld", () => {
  it("returns a greeting with the provided name", () => {
    expect(helloWorld("World")).toBe("Hello World!");
  });
});
