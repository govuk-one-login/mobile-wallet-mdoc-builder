import { encode } from "../cbor";
import { COSE_ALG_ES256, COSE_HEADER_ALG } from "./constants.js";

export function buildProtectedHeader(): Uint8Array {
  const header = new Map<number, number>([[COSE_HEADER_ALG, COSE_ALG_ES256]]);
  return encode(header);
}
