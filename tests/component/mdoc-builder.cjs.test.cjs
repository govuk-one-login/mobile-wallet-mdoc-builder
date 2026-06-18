const { helloWorld } = require("../../dist/index.cjs");

it("returns a greeting with the provided name", () => {
  expect(helloWorld("World")).toBe("Hello World!");
});
