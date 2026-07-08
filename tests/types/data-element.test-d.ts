import { describe, expectTypeOf, it } from "vitest";
import type { DataElement } from "../../src/types/data-element.js";
import type { DataElementValue } from "../../src/types/data-element-value.js";
import type { DateFormat } from "../../src/types/date-format.js";

describe("DataElement", () => {
  it("accepts a valid DataElement with required fields", () => {
    expectTypeOf<{
      elementIdentifier: string;
      elementValue: DataElementValue;
    }>().toExtend<DataElement>();
  });

  it("accepts a valid DataElement with optional dateFormat", () => {
    expectTypeOf<{
      elementIdentifier: string;
      elementValue: DataElementValue;
      dateFormat: DateFormat;
    }>().toExtend<DataElement>();
  });

  it("does not accept missing elementIdentifier", () => {
    expectTypeOf<{
      elementValue: DataElementValue;
    }>().not.toExtend<DataElement>();
  });

  it("does not accept missing elementValue", () => {
    expectTypeOf<{
      elementIdentifier: string;
    }>().not.toExtend<DataElement>();
  });

  it("does not accept wrong type for elementIdentifier", () => {
    expectTypeOf<{
      elementIdentifier: number;
      elementValue: DataElementValue;
    }>().not.toExtend<DataElement>();
  });

  it("does not accept wrong type for elementValue", () => {
    expectTypeOf<{
      elementIdentifier: string;
      elementValue: null;
    }>().not.toExtend<DataElement>();
  });

  it("does not accept wrong type for dateFormat", () => {
    expectTypeOf<{
      elementIdentifier: string;
      elementValue: DataElementValue;
      dateFormat: string;
    }>().not.toExtend<DataElement>();
  });
});
