import { describe, it, expect } from "vitest";
import { credentialValiditySchema } from "./credentialValidity.js";
import { mapZodErrorToValidationErrors } from "./errors.js";
import type { ValidationError } from "./errors.js";
import type { CredentialValidity } from "../types/index.js";

const now = new Date("2026-01-01T00:00:00Z");
const schema = credentialValiditySchema(now);

const future = new Date("2027-01-01T00:00:00Z");
const laterFuture = new Date("2028-01-01T00:00:00Z");
const past = new Date("2025-01-01T00:00:00Z");

const accepts = (value: CredentialValidity) => schema.safeParse(value).success;

const errorsFor = (value: CredentialValidity): ValidationError[] => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("expected failure");
  return mapZodErrorToValidationErrors(result.error);
};

describe("credentialValiditySchema — validUntil", () => {
  it("accepts a validUntil after now", () => {
    expect(accepts({ validUntil: future })).toBe(true);
  });

  it("rejects a validUntil before now", () => {
    expect(errorsFor({ validUntil: past })).toContainEqual({
      field: "validUntil",
      message: "must be after the current time",
    });
  });

  it("rejects a validUntil exactly at now (zero tolerance)", () => {
    expect(accepts({ validUntil: new Date(now) })).toBe(false);
  });

  it("rejects an Invalid Date validUntil", () => {
    expect(accepts({ validUntil: new Date("nope") })).toBe(false);
  });

  it("rejects a missing validUntil", () => {
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("rejects a non-Date validUntil", () => {
    expect(schema.safeParse({ validUntil: "2027-01-01" }).success).toBe(false);
  });
});

describe("credentialValiditySchema — earliestValidFrom", () => {
  it("accepts when omitted", () => {
    expect(accepts({ validUntil: future })).toBe(true);
  });

  it("accepts when strictly before validUntil", () => {
    expect(accepts({ earliestValidFrom: past, validUntil: future })).toBe(true);
  });

  it("rejects when equal to validUntil", () => {
    expect(
      errorsFor({ earliestValidFrom: future, validUntil: future }),
    ).toContainEqual({
      field: "earliestValidFrom",
      message: "must be before validUntil",
    });
  });

  it("rejects when after validUntil", () => {
    expect(
      accepts({ earliestValidFrom: laterFuture, validUntil: future }),
    ).toBe(false);
  });

  it("rejects an Invalid Date earliestValidFrom", () => {
    expect(
      accepts({ earliestValidFrom: new Date("nope"), validUntil: future }),
    ).toBe(false);
  });
});

describe("credentialValiditySchema — expectedUpdate", () => {
  it("accepts when omitted", () => {
    expect(accepts({ validUntil: future })).toBe(true);
  });

  it("accepts when before validUntil", () => {
    expect(accepts({ validUntil: laterFuture, expectedUpdate: future })).toBe(
      true,
    );
  });

  it("accepts when equal to validUntil", () => {
    expect(accepts({ validUntil: future, expectedUpdate: future })).toBe(true);
  });

  it("rejects when after validUntil", () => {
    expect(
      errorsFor({ validUntil: future, expectedUpdate: laterFuture }),
    ).toContainEqual({
      field: "expectedUpdate",
      message: "must be before or equal to validUntil",
    });
  });

  it("rejects an Invalid Date expectedUpdate", () => {
    expect(
      accepts({ validUntil: future, expectedUpdate: new Date("nope") }),
    ).toBe(false);
  });
});

describe("credentialValiditySchema — injected clock", () => {
  it("uses the injected now, not the system clock", () => {
    const farFuture = credentialValiditySchema(
      new Date("2100-01-01T00:00:00Z"),
    );
    expect(farFuture.safeParse({ validUntil: future }).success).toBe(false);
  });
});
