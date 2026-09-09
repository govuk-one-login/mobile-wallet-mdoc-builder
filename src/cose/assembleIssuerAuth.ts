import type { SigningFunction } from "../types";
import type { IssuerAuth } from "./issuerAuth.js";

export async function assembleIssuerAuth(
  toBeSigned: Uint8Array,
  protectedHeader: Uint8Array,
  msoBytes: Uint8Array,
  unprotectedHeader: Map<number, Uint8Array>,
  sign: SigningFunction,
): Promise<IssuerAuth> {
  const signature = await sign(toBeSigned);

  return [protectedHeader, unprotectedHeader, msoBytes, signature];
}
