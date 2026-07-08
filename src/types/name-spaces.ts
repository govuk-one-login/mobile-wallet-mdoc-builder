import type { DataElement } from "./data-element.js";

/**
 * A map of namespace identifiers to their data elements.
 *
 * Each key is a namespace string (e.g. "org.iso.18013.5.1") and each value
 * is the array of data elements within that namespace. Uses Map to preserve
 * insertion order for deterministic CBOR encoding.
 */
export type NameSpaces = Map<string, DataElement[]>;
