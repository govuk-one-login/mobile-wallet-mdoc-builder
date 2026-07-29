import type { CredentialValidity } from "../types";
import type { ValidityInfo } from "./validityInfo.js";

export function buildValidityInfo(input: CredentialValidity): ValidityInfo {
  const signed = new Date();

  const validFrom =
    input.earliestValidFrom && input.earliestValidFrom > signed
      ? input.earliestValidFrom
      : signed;

  return {
    signed,
    validFrom,
    validUntil: input.validUntil,
    ...(input.expectedUpdate !== undefined && {
      expectedUpdate: input.expectedUpdate,
    }),
  };
}
