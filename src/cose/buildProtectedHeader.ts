import { encode } from "../cbor";

// COSE identifiers — see https://www.iana.org/assignments/cose/cose.xhtml
const COSE_HEADER_ALG = 1; // alg header label
const COSE_ALG_ES256 = -7; // ECDSA w/ SHA-256

export function buildProtectedHeader(): Uint8Array {
  const header = new Map<number, number>([[COSE_HEADER_ALG, COSE_ALG_ES256]]);
  return encode(header);
}
