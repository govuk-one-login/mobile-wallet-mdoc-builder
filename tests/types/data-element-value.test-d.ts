import { describe, expectTypeOf, it } from "vitest";
import type { DataElementValue, PrimitiveElementValue } from "../../src";

describe("PrimitiveElementValue", () => {
  it("is exactly string | number | boolean | Date | Uint8Array", () => {
    expectTypeOf<PrimitiveElementValue>().toExtend<
      string | number | boolean | Date | Uint8Array
    >();
    expectTypeOf<
      string | number | boolean | Date | Uint8Array
    >().toExtend<PrimitiveElementValue>();
  });

  it("does not accept null", () => {
    expectTypeOf<null>().not.toExtend<PrimitiveElementValue>();
  });

  it("does not accept undefined", () => {
    expectTypeOf<undefined>().not.toExtend<PrimitiveElementValue>();
  });

  it("does not accept plain objects", () => {
    expectTypeOf<{ key: string }>().not.toExtend<PrimitiveElementValue>();
  });
});

describe("DataElementValue", () => {
  it("is exactly PrimitiveElementValue | PrimitiveElementValue[] | Map<string, PrimitiveElementValue> | Map<string, PrimitiveElementValue>[]", () => {
    type Expected =
      | PrimitiveElementValue
      | PrimitiveElementValue[]
      | Map<string, PrimitiveElementValue>
      | Map<string, PrimitiveElementValue>[];

    expectTypeOf<DataElementValue>().toExtend<Expected>();
    expectTypeOf<Expected>().toExtend<DataElementValue>();
  });

  it("does not accept null", () => {
    expectTypeOf<null>().not.toExtend<DataElementValue>();
  });

  it("does not accept undefined", () => {
    expectTypeOf<undefined>().not.toExtend<DataElementValue>();
  });

  it("does not accept plain objects", () => {
    expectTypeOf<{ key: string }>().not.toExtend<DataElementValue>();
  });
});
