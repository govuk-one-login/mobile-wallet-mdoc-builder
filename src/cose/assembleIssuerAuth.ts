import { MdocBuilderError } from "../types";
import type { SigningFunction } from "../types";
import type { IssuerAuth } from "./issuerAuth.js";

// ECDSA P-256 raw signatures are r||s, 32 bytes each.
const EXPECTED_SIGNATURE_LENGTH = 64;

export async function assembleIssuerAuth(
  toBeSigned: Uint8Array,
  protectedHeader: Uint8Array,
  msoBytes: Uint8Array,
  unprotectedHeader: Map<number, Uint8Array>,
  sign: SigningFunction,
): Promise<IssuerAuth> {
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
