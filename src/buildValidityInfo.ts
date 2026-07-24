import type { CredentialValidity } from "./types/credentialValidity.js";
import type { ValidityInfo } from "./types/validityInfo.js";

/**
 * Builds a ValidityInfo structure from the provided credential validity input.
 *
 * This function must be called immediately before MSO assembly to ensure
 * `signed` reflects the actual moment of MSO construction.
 *
 * @param input - The credential validity preferences provided by the caller.
 * @param now - The current time. Defaults to `new Date()`. Accept a fixed value for deterministic testing.
 * @returns A ValidityInfo object as defined by ISO/IEC 18013-5 §9.1.2.4.
 */
export function buildValidityInfo(
  input: CredentialValidity,
  now: Date = new Date(),
): ValidityInfo {
  const signed = now;

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
