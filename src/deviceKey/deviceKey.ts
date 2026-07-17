import crypto from "node:crypto";
import { MdocBuilderError } from "../types/mdocBuilderError.js";

export function buildDeviceKeyInfo(
  spkiBytes: Uint8Array,
  namespaceNames: string[],
): Map<string, unknown> {
  console.log("To pass eslint, will remove later", namespaceNames);
  const keyObject = importSpki(spkiBytes);
  const jwk = keyObject.export({ format: "jwk" });

  if (jwk.crv !== "P-256") {
    throw new MdocBuilderError(
      `Unsupported curve: ${String(jwk.crv)}. Only P-256 ECDSA keys are supported.`,
    );
  }

  const deviceKeyInfo = new Map<string, unknown>();
  return deviceKeyInfo;
}

function importSpki(spkiBytes: Uint8Array): crypto.KeyObject {
  try {
    return crypto.createPublicKey({
      key: Buffer.from(spkiBytes),
      format: "der",
      type: "spki",
    });
  } catch (error: unknown) {
    const message = (error as Error).message;
    throw new MdocBuilderError(`Failed to import SPKI key: ${message}`);
  }
}
