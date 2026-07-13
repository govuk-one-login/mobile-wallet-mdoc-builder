import { expect, it } from "vitest";
import { buildMdoc, MdocBuilderError } from "../../dist/index.js";
import { MdocBuilderInput } from "../../src";

it("buildMdoc rejects with MdocBuilderError", async () => {
  const input = {} as unknown as MdocBuilderInput;
  const sign = async () => new Uint8Array();

  await expect(buildMdoc(input, sign)).rejects.toThrow(MdocBuilderError);
});
