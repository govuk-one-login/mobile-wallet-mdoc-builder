/**
 * Defines the validity period of a credential.
 *
 * Maps to the ValidityInfo structure in ISO 18013-5.
 */
export interface CredentialValidity {
  /** The earliest point in time from which the credential is valid. */
  earliestValidFrom?: Date;

  /** The point in time at which the credential expires. */
  validUntil: Date;

  /** The expected time at which the credential will be updated. */
  expectedUpdate?: Date;
}
