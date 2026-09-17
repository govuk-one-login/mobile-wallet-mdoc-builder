import { MdocBuilderError } from "../types";
import type { SigningFunction } from "../types";
import { buildProtectedHeader } from "./buildProtectedHeader.js";
import { buildUnprotectedHeader } from "./buildUnprotectedHeader.js";
import { buildToBeSigned } from "./buildToBeSigned.js";

// ECDSA P-256 raw signatures are r||s, 32 bytes each.
const EXPECTED_SIGNATURE_LENGTH = 64;

// COSE_Sign1: [protectedHeader, unprotectedHeader, msoBytes (Tag 24), signature] — RFC 9052 §4.2, ISO 18013-5 §9.1.2
export type IssuerAuth = [
  Uint8Array,
  Map<number, Uint8Array>,
  Uint8Array,
  Uint8Array,
];

export async function assembleIssuerAuth(
  msoBytes: Uint8Array,
  certificateChain: [Uint8Array, ...Uint8Array[]],
  sign: SigningFunction,
): Promise<IssuerAuth> {
  const protectedHeader = buildProtectedHeader();
  const unprotectedHeader = buildUnprotectedHeader(certificateChain);
  const toBeSigned = buildToBeSigned(protectedHeader, msoBytes);

  let signature: Uint8Array;
  try {
    signature = await sign(toBeSigned);
  } catch (error: unknown) {
    throw new MdocBuilderError("Signing function threw an error", {
      cause: error,
    });
  }

  if (!(signature instanceof Uint8Array)) {
    throw new MdocBuilderError(
      "Signing function must return a Uint8Array signature",
    );
  }

  if (signature.length !== EXPECTED_SIGNATURE_LENGTH) {
    throw new MdocBuilderError(
      `Invalid signature length: expected ${String(EXPECTED_SIGNATURE_LENGTH)} bytes, got ${String(signature.length)}`,
    );
  }

  return [protectedHeader, unprotectedHeader, msoBytes, signature];
}
