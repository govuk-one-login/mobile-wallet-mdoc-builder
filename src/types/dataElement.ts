import type { DataElementValue } from "./dataElementValue.js";
import type { DateFormat } from "./dateFormat.js";

/**
 * A single data element within a namespace.
 *
 * Represents an identifier–value pair as defined in ISO 18013-5,
 * with an optional date format hint for Date values.
 */
export interface DataElement {
  /** The element identifier (e.g. "family_name", "birth_date"). */
  elementIdentifier: string;

  /** The element value. */
  elementValue: DataElementValue;

  /** Optional format for Date values. Defaults to DateTime (Tag 0, tdate) when not specified. */
  dateFormat?: DateFormat;
}
