import { describe, expectTypeOf, it } from "vitest";
import type { StatusList } from "../../src/types/status-list.js";

describe("StatusList", () => {
  it("accepts a valid object with idx and uri", () => {
    expectTypeOf<{ idx: number; uri: string }>().toExtend<StatusList>();
  });

  it("does not accept missing idx", () => {
    expectTypeOf<{ uri: string }>().not.toExtend<StatusList>();
  });

  it("does not accept missing uri", () => {
    expectTypeOf<{ idx: number }>().not.toExtend<StatusList>();
  });

  it("does not accept wrong type for idx", () => {
    expectTypeOf<{ idx: string; uri: string }>().not.toExtend<StatusList>();
  });

  it("does not accept wrong type for uri", () => {
    expectTypeOf<{ idx: number; uri: number }>().not.toExtend<StatusList>();
  });
});
