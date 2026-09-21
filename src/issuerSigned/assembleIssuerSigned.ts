import { embeddedCbor, encode } from "../cbor";
import type { IssuerAuth } from "../issuerAuth";

// Assemble the final IssuerSigned structure and CBOR-encode it — ISO 18013-5 §9.1.2.
export function assembleIssuerSigned(
  nameSpaces: Map<string, Uint8Array[]>,
  issuerAuth: IssuerAuth,
): Uint8Array {
  const nameSpacesMap = new Map<string, unknown[]>();
  for (const [namespace, items] of nameSpaces) {
    nameSpacesMap.set(
      namespace,
      items.map((itemBytes) => embeddedCbor(itemBytes)),
    );
  }

  const issuerSigned = new Map<string, unknown>();
  issuerSigned.set("nameSpaces", nameSpacesMap);
  issuerSigned.set("issuerAuth", issuerAuth);

  return encode(issuerSigned);
}
