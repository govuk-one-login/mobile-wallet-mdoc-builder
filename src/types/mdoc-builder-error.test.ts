import { describe, expect, it } from "vitest";
import { MdocBuilderError } from "./mdoc-builder-error.js";

describe("MdocBuilderError", () => {
  it("is an instance of Error", () => {
    const error = new MdocBuilderError("something went wrong");
    expect(error).toBeInstanceOf(Error);
  });

  it("is an instance of MdocBuilderError", () => {
    const error = new MdocBuilderError("something went wrong");
    expect(error).toBeInstanceOf(MdocBuilderError);
  });

  it("has the correct message", () => {
    const error = new MdocBuilderError("something went wrong");
    expect(error.message).toBe("something went wrong");
  });

  it("has name set to MdocBuilderError", () => {
    const error = new MdocBuilderError("something went wrong");
    expect(error.name).toBe("MdocBuilderError");
  });
});
