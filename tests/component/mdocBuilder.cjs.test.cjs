const { buildMdoc, MdocBuilderError } = require("../../dist/index.cjs");

it("buildMdoc rejects with MdocBuilderError", async () => {
  const input = {};
  const sign = async () => new Uint8Array();

  await expect(buildMdoc(input, sign)).rejects.toThrow(MdocBuilderError);
});
