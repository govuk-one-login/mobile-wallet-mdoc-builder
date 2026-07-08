/**
 * The union of permitted scalar types for a data element value.
 *
 * These map to the CBOR major types used in ISO 18013-5 mdoc documents.
 */
export type PrimitiveElementValue =
  | string
  | number
  | boolean
  | Date
  | Uint8Array;

/**
 * The union of all permitted data element value types.
 *
 * A data element value can be a single primitive, an array of primitives,
 * a map of string keys to primitives, or an array of such maps.
 */
export type DataElementValue =
  | PrimitiveElementValue
  | PrimitiveElementValue[]
  | Map<string, PrimitiveElementValue>
  | Map<string, PrimitiveElementValue>[];
