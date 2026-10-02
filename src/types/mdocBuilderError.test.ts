import { describe, expect, it } from "vitest";
import { MdocBuilderError } from "./mdocBuilderError.js";

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

  it("has no violations by default", () => {
    const error = new MdocBuilderError("something went wrong");
    expect(error.violations).toBeUndefined();
  });

  it("carries structured violations when provided", () => {
    const violations = [
      { field: "documentType", message: "must not be empty" },
      { field: "statusList.idx", message: "must be non-negative" },
    ];
    const error = new MdocBuilderError("Input validation failed", {
      violations,
    });
    expect(error.violations).toEqual(violations);
  });

  it("forwards the standard cause option", () => {
    const cause = new Error("root cause");
    const error = new MdocBuilderError("wrapped", { cause });
    expect(error.cause).toBe(cause);
    expect(error.violations).toBeUndefined();
  });
});
