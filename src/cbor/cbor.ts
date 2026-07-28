import { Tag, encode as cborEncode } from "cbor2";
import { MdocBuilderError } from "../types/mdocBuilderError.js";

export class TaggedValue {
  readonly tagNumber: number;
  readonly contents: unknown;

  constructor(tagNumber: number, contents: unknown) {
    this.tagNumber = tagNumber;
    this.contents = contents;
  }
}

const CBOR_TAG = {
  /** Tag 0: Standard date/time string () */
  TDATE: 0,
  /** Tag 24: Encoded CBOR data item (bstr-wrapped CBOR) */
  EMBEDDED_CBOR: 24,
  /** Tag 1004: Full-date string (YYYY-MM-DD) */
  FULL_DATE: 1004,
} as const;

export function tdate(date: Date): TaggedValue {
  // ISO 18013-5 timestamps must not use fractional seconds.
  // toISOString() produces "...T12:00:00.000Z" — strip the ".000" milliseconds.
  const iso = date.toISOString().replace(/\.\d{3}/, "");
  return new TaggedValue(CBOR_TAG.TDATE, iso);
}

export function fullDate(date: string): TaggedValue {
  // Matches exactly "YYYY-MM-DD". Anchored to reject trailing content.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new MdocBuilderError(
      `fullDate requires a "YYYY-MM-DD" string, received: "${date}"`,
    );
  }
  return new TaggedValue(CBOR_TAG.FULL_DATE, date);
}

export function embeddedCbor(bytes: Uint8Array): TaggedValue {
  return new TaggedValue(CBOR_TAG.EMBEDDED_CBOR, bytes);
}

export function encode(value: unknown): Uint8Array {
  const prepared = convertTags(value);
  return cborEncode(prepared);
}

function convertTags(value: unknown): unknown {
  if (value instanceof TaggedValue) {
    return new Tag(value.tagNumber, convertTags(value.contents));
  }
  if (value instanceof Map) {
    const prepared = new Map<unknown, unknown>();
    for (const [k, v] of value) {
      prepared.set(convertTags(k), convertTags(v));
    }
    return prepared;
  }
  if (Array.isArray(value)) {
    return value.map(convertTags);
  }
  return value;
}
