/**
 * Represents the ValidityInfo structure as defined by ISO/IEC 18013-5 §9.1.2.4.
 *
 * This is an internal type used during MSO construction.
 */
export interface ValidityInfo {
  /** The point in time at which the MSO was signed. */
  signed: Date;

  /** The point in time from which the credential is valid. */
  validFrom: Date;

  /** The point in time at which the credential expires. */
  validUntil: Date;

  /** The expected time at which the credential will be updated. */
  expectedUpdate?: Date;
}
