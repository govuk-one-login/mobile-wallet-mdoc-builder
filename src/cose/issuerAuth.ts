/**
 * issuerAuth is the COSE_Sign1 structure defined in RFC 9052 §4.2, referenced
 * by ISO/IEC 18013-5 §9.1.2. It is a four-element array:
 *
 *   [ protected header (bstr),
 *     unprotected header (map, containing x5chain),
 *     payload — Tag 24 wrapped MSO bytes (bstr),
 *     signature (bstr) ]
 *
 * This is the plain (not-yet-CBOR-encoded) JS representation. CBOR encoding is
 * performed later during IssuerSigned assembly.
 */
export type IssuerAuth = [
  Uint8Array,
  Map<number, Uint8Array>,
  Uint8Array,
  Uint8Array,
];
