import { describe, it, expect } from "vitest";
import { z } from "zod";
import { formatFieldPath, mapZodErrorToValidationErrors } from "./errors.js";

describe("formatFieldPath", () => {
  it("returns an empty string for the root path", () => {
    expect(formatFieldPath([])).toBe("");
  });

  it("returns a single string segment unchanged", () => {
    expect(formatFieldPath(["documentType"])).toBe("documentType");
  });

  it("joins nested string segments with dots", () => {
    expect(formatFieldPath(["credentialValidity", "validUntil"])).toBe(
      "credentialValidity.validUntil",
    );
  });

  it("renders a leading numeric segment as a bracket index", () => {
    expect(formatFieldPath([0])).toBe("[0]");
  });

  it("renders numeric segments as bracket indices without a preceding dot", () => {
    expect(formatFieldPath(["certificateChain", 2])).toBe(
      "certificateChain[2]",
    );
  });

  it("renders a namespace map key and nested array/field path", () => {
    expect(
      formatFieldPath(["nameSpaces", "org.example.1", 0, "elementValue"]),
    ).toBe("nameSpaces.org.example.1[0].elementValue");
  });

  it("chains consecutive numeric segments", () => {
    expect(formatFieldPath(["a", 0, 1])).toBe("a[0][1]");
  });
});

describe("mapZodErrorToValidationErrors", () => {
  it("maps every issue to a field and message, preserving order", () => {
    const schema = z.object({
      documentType: z.string().min(1),
      statusList: z.object({ idx: z.number().int() }),
    });

    const result = schema.safeParse({
      documentType: "",
      statusList: { idx: 1.5 },
    });
    if (result.success) throw new Error("expected failure");

    const errors = mapZodErrorToValidationErrors(result.error);

    expect(errors.map((e) => e.field)).toEqual([
      "documentType",
      "statusList.idx",
    ]);
    expect(errors.every((e) => e.message.length > 0)).toBe(true);
  });

  it("returns a root field for a top-level type failure", () => {
    const result = z.string().safeParse(123);
    if (result.success) throw new Error("expected failure");

    const errors = mapZodErrorToValidationErrors(result.error);

    expect(errors.map((e) => e.field)).toEqual([""]);
    expect(errors.every((e) => e.message.length > 0)).toBe(true);
  });

  it("expands an unrecognized-keys issue into one error per offending key", () => {
    const schema = z.object({ a: z.string() }).strict();

    const result = schema.safeParse({ a: "x", foo: 1, bar: 2 });
    if (result.success) throw new Error("expected failure");

    const errors = mapZodErrorToValidationErrors(result.error);

    expect(errors.map((e) => e.field)).toEqual(["foo", "bar"]);
    expect(errors.every((e) => e.message.length > 0)).toBe(true);
  });

  it("prefixes unrecognized keys with the nested object path", () => {
    const schema = z.object({
      outer: z.object({ a: z.string() }).strict(),
    });

    const result = schema.safeParse({ outer: { a: "x", foo: 1 } });
    if (result.success) throw new Error("expected failure");

    const errors = mapZodErrorToValidationErrors(result.error);

    expect(errors.map((e) => e.field)).toEqual(["outer.foo"]);
  });

  it("translates map and array paths into the dotted-bracket format", () => {
    // Mirrors the nameSpaces shape: Map<string, Array<{ ... }>>.
    const schema = z.map(z.string(), z.array(z.object({ v: z.string() })));
    // Namespace "ns" holds one element whose "v" is a number, not a string.
    // The `as unknown as string` bypasses the compiler to feed the runtime a
    // deliberately-invalid value, so Zod produces an issue at path ["ns", 0, "v"].
    const result = schema.safeParse(
      new Map([["ns", [{ v: 1 as unknown as string }]]]),
    );
    if (result.success) throw new Error("expected failure");

    const errors = mapZodErrorToValidationErrors(result.error);

    expect(errors.map((e) => e.field)).toEqual(["ns[0].v"]);
  });
});
