import { encode } from "../cbor";

/** Context string for a COSE_Sign1 signature. @see RFC 9052 §4.4 */
const SIG_STRUCTURE_CONTEXT = "Signature1";

/** External AAD — empty for mdoc. @see RFC 9052 §4.4 */
const EXTERNAL_AAD = new Uint8Array(0);

export function buildToBeSigned(
  protectedHeaderBytes: Uint8Array,
  payloadBytes: Uint8Array,
): Uint8Array {
  const sigStructure = [
    SIG_STRUCTURE_CONTEXT,
    protectedHeaderBytes,
    EXTERNAL_AAD,
    payloadBytes,
  ];

  return encode(sigStructure);
}
