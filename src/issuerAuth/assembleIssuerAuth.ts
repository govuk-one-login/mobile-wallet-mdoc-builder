import { MdocBuilderError } from "../types";
import type { SigningFunction } from "../types";
import { buildProtectedHeader } from "./buildProtectedHeader.js";
import { buildUnprotectedHeader } from "./buildUnprotectedHeader.js";
import { buildToBeSigned } from "./buildToBeSigned.js";

// ECDSA P-256 raw signatures are r||s, 32 bytes each.
const EXPECTED_SIGNATURE_LENGTH = 64;

/**
 * The issuerAuth COSE_Sign1 structure (RFC 9052 §4.2, ISO 18013-5 §9.1.2):
 * a four-element array of [protected header, unprotected header, payload
 * (Tag 24 wrapped MSO bytes), signature].
 *
 * This is the plain JS representation; CBOR encoding happens later during
 * IssuerSigned assembly.
 */
export type IssuerAuth = [
  Uint8Array,
  Map<number, Uint8Array>,
  Uint8Array,
  Uint8Array,
];

/**
 * Assembles the issuerAuth COSE_Sign1 structure.
 *
 * Orchestrates the signing flow: builds the protected header (alg: ES256) and
 * unprotected header (x5chain), derives the Sig_Structure `toBeSigned` bytes
 * over the Tag 24 wrapped MSO payload, invokes the caller's signing function,
 * validates the returned signature, and returns the four-element
 * [protectedHeader, unprotectedHeader, msoBytes, signature] array.
 *
 * @param msoBytes - The Tag 24 wrapped MSO bytes used as the COSE payload.
 * @param certificateChain - The signing certificate chain (leaf first).
 * @param sign - The caller's signing function.
 * @returns The assembled issuerAuth structure.
 * @throws {MdocBuilderError} If the signing function throws or returns an
 *   invalid signature.
 */
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
