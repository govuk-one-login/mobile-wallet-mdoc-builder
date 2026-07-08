import { describe, expect, it } from "vitest";
import { DateFormat } from "./date-format.js";

describe("DateFormat", () => {
  it("FullDate has value 0", () => {
    expect(DateFormat.FullDate).toBe(0);
  });

  it("DateTime has value 1", () => {
    expect(DateFormat.DateTime).toBe(1);
  });
});
