import type { CredentialValidity } from "../types";

export interface ValidityInfo {
  signed: Date;
  validFrom: Date;
  validUntil: Date;
  expectedUpdate?: Date;
}

export function buildValidityInfo(input: CredentialValidity): ValidityInfo {
  const signed = new Date();

  const validFrom =
    input.earliestValidFrom && input.earliestValidFrom > signed
      ? input.earliestValidFrom
      : signed;

  const validityInfo: ValidityInfo = {
    signed,
    validFrom,
    validUntil: input.validUntil,
  };

  if (input.expectedUpdate !== undefined) {
    validityInfo.expectedUpdate = input.expectedUpdate;
  }

  return validityInfo;
}
