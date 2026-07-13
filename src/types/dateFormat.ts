/**
 * Specifies the date encoding format for a data element.
 *
 * Used to indicate whether a Date value should be encoded as a full-date
 * (YYYY-MM-DD) or a date-time (ISO 8601 with time component) in the
 * resulting CBOR structure.
 */
export enum DateFormat {
  /** Encode as a full-date (YYYY-MM-DD) per RFC 3339. */
  FullDate = 0,

  /** Encode as a date-time (YYYY-MM-DDTHH:mm:ssZ) per RFC 3339. */
  DateTime = 1,
}
