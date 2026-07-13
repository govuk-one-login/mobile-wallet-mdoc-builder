import { describe, expectTypeOf, it } from "vitest";
import { DateFormat } from "../../src";

describe("DateFormat", () => {
  it("is exactly DateFormat.FullDate | DateFormat.DateTime", () => {
    expectTypeOf<DateFormat>().toExtend<
      DateFormat.FullDate | DateFormat.DateTime
    >();
    expectTypeOf<
      DateFormat.FullDate | DateFormat.DateTime
    >().toExtend<DateFormat>();
  });

  it("does not accept arbitrary numbers", () => {
    expectTypeOf<999>().not.toExtend<DateFormat>();
  });

  it("does not accept strings", () => {
    expectTypeOf<string>().not.toExtend<DateFormat>();
  });
});
