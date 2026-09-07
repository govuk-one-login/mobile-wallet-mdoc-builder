import { describe, it, expect } from "vitest";
import { isLatin1, LATIN1_MESSAGE } from "./latin1.js";

describe("isLatin1", () => {
  it("accepts an empty string", () => {
    expect(isLatin1("")).toBe(true);
  });

  it("accepts plain ASCII", () => {
    expect(isLatin1("org.iso.18013.5.1.mDL")).toBe(true);
  });

  it("accepts the lower boundary code point U+0000", () => {
    expect(isLatin1("\u0000")).toBe(true);
  });

  it("accepts the upper boundary code point U+00FF", () => {
    expect(isLatin1("\u00FF")).toBe(true);
  });

  it("accepts accented Latin-1 characters", () => {
    expect(isLatin1("café")).toBe(true);
    expect(isLatin1("Müller")).toBe(true);
    expect(isLatin1("mañana")).toBe(true);
  });

  it("rejects the first code point above Latin-1 (U+0100)", () => {
    expect(isLatin1("\u0100")).toBe(false);
  });

  it("rejects the euro sign (U+20AC)", () => {
    expect(isLatin1("€")).toBe(false);
  });

  it("rejects CJK characters", () => {
    expect(isLatin1("日本")).toBe(false);
  });

  it("rejects astral-plane characters (emoji)", () => {
    expect(isLatin1("😀")).toBe(false);
  });

  it("rejects a string mixing Latin-1 and non-Latin-1 characters", () => {
    expect(isLatin1("café€")).toBe(false);
  });
});

describe("LATIN1_MESSAGE", () => {
  it("is a non-empty descriptive message", () => {
    expect(LATIN1_MESSAGE.length).toBeGreaterThan(0);
    expect(LATIN1_MESSAGE).toContain("Latin1");
  });
});
