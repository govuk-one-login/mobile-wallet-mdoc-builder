import { MdocBuilderError } from "../types/mdocBuilderError.js";

// COSE identifiers — see https://www.iana.org/assignments/cose/cose.xhtml
const COSE_HEADER_X5CHAIN = 33; // x5chain header label

/**
 * Builds the COSE_Sign1 unprotected header carrying the x5chain parameter.
 *
 * Returns a plain JS structure (not CBOR-encoded); CBOR encoding happens
 * during COSE_Sign1 assembly. Only the first certificate is used — it is
 * placed directly as a bare bstr (RFC 9360 single-certificate form).
 */
export function buildUnprotectedHeader(
  certificateChain: Uint8Array[],
): Map<number, Uint8Array> {
  const [signingCertificate] = certificateChain;
  if (signingCertificate === undefined) {
    throw new MdocBuilderError(
      "buildUnprotectedHeader requires at least one certificate, but the certificate chain is empty",
    );
  }

  return new Map<number, Uint8Array>([
    [COSE_HEADER_X5CHAIN, signingCertificate],
  ]);
}
