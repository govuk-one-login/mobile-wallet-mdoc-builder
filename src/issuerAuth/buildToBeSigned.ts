import { encode } from "../cbor";

const SIG_STRUCTURE_CONTEXT = "Signature1";

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
