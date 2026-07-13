import { describe, expectTypeOf, it } from "vitest";
import type { CredentialValidity } from "../../src";

describe("CredentialValidity", () => {
  it("accepts a valid object with only validUntil", () => {
    expectTypeOf<{ validUntil: Date }>().toExtend<CredentialValidity>();
  });

  it("accepts a valid object with all fields", () => {
    expectTypeOf<{
      earliestValidFrom: Date;
      validUntil: Date;
      expectedUpdate: Date;
    }>().toExtend<CredentialValidity>();
  });

  it("accepts a valid object with only earliestValidFrom optional", () => {
    expectTypeOf<{
      earliestValidFrom: Date;
      validUntil: Date;
    }>().toExtend<CredentialValidity>();
  });

  it("accepts a valid object with only expectedUpdate optional", () => {
    expectTypeOf<{
      validUntil: Date;
      expectedUpdate: Date;
    }>().toExtend<CredentialValidity>();
  });

  it("does not accept missing validUntil", () => {
    expectTypeOf<{
      earliestValidFrom: Date;
      expectedUpdate: Date;
    }>().not.toExtend<CredentialValidity>();
  });

  it("does not accept wrong type for validUntil", () => {
    expectTypeOf<{ validUntil: string }>().not.toExtend<CredentialValidity>();
  });

  it("does not accept wrong type for earliestValidFrom", () => {
    expectTypeOf<{
      earliestValidFrom: string;
      validUntil: Date;
    }>().not.toExtend<CredentialValidity>();
  });

  it("does not accept wrong type for expectedUpdate", () => {
    expectTypeOf<{
      validUntil: Date;
      expectedUpdate: string;
    }>().not.toExtend<CredentialValidity>();
  });
});
