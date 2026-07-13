import { describe, expectTypeOf, it } from "vitest";
import type { Mdoc } from "../../src";

describe("Mdoc", () => {
  it("has asBase64Url returning string", () => {
    expectTypeOf<Mdoc["asBase64Url"]>().toExtend<() => string>();
  });

  it("has asHex returning string", () => {
    expectTypeOf<Mdoc["asHex"]>().toExtend<() => string>();
  });

  it("has asBytes returning Uint8Array", () => {
    expectTypeOf<Mdoc["asBytes"]>().toExtend<() => Uint8Array>();
  });

  it("does not accept an object missing asBase64Url", () => {
    expectTypeOf<{
      asHex: () => string;
      asBytes: () => Uint8Array;
    }>().not.toExtend<Mdoc>();
  });

  it("does not accept an object missing asHex", () => {
    expectTypeOf<{
      asBase64Url: () => string;
      asBytes: () => Uint8Array;
    }>().not.toExtend<Mdoc>();
  });

  it("does not accept an object missing asBytes", () => {
    expectTypeOf<{
      asBase64Url: () => string;
      asHex: () => string;
    }>().not.toExtend<Mdoc>();
  });
});
