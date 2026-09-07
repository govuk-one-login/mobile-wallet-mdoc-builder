import { describe, it, expect } from "vitest";
import * as validation from "./index.js";

describe("validation barrel", () => {
  it("exports validateMdocBuilderInput", () => {
    expect(typeof validation.validateMdocBuilderInput).toBe("function");
  });

  it("exports only the public runtime API", () => {
    expect(Object.keys(validation)).toEqual(["validateMdocBuilderInput"]);
  });

  it("does not leak zod symbols", () => {
    const keys = Object.keys(validation);
    expect(keys.some((k) => k.toLowerCase().includes("zod"))).toBe(false);
    expect(keys).not.toContain("z");
  });
});
