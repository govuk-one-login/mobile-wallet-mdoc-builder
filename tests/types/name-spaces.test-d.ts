import { describe, expectTypeOf, it } from "vitest";
import type { NameSpaces } from "../../src/types/name-spaces.js";
import type { DataElement } from "../../src/types/data-element.js";

describe("NameSpaces", () => {
  it("is assignable from Map<string, DataElement[]>", () => {
    expectTypeOf<Map<string, DataElement[]>>().toExtend<NameSpaces>();
  });

  it("extends Map<string, DataElement[]>", () => {
    expectTypeOf<NameSpaces>().toExtend<Map<string, DataElement[]>>();
  });

  it("does not accept Map<string, string>", () => {
    expectTypeOf<Map<string, string>>().not.toExtend<NameSpaces>();
  });

  it("does not accept Record<string, DataElement[]>", () => {
    expectTypeOf<Record<string, DataElement[]>>().not.toExtend<NameSpaces>();
  });
});
