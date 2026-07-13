import { describe, expect, it } from "vitest";
import { buildMdoc, MdocBuilderError } from "./index.js";
import type { MdocBuilderInput, SigningFunction } from "./index.js";

describe("buildMdoc", () => {
  it("throws MdocBuilderError with 'not implemented' message", async () => {
    const input = {} as MdocBuilderInput;
    const sign = (() => Promise.resolve(new Uint8Array())) as SigningFunction;

    await expect(buildMdoc(input, sign)).rejects.toThrow(MdocBuilderError);
  });

  it("throws with the correct message", async () => {
    const input = {} as MdocBuilderInput;
    const sign = (() => Promise.resolve(new Uint8Array())) as SigningFunction;

    await expect(buildMdoc(input, sign)).rejects.toThrow("not implemented");
  });
});
