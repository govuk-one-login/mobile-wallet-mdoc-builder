import crypto from "node:crypto";
import { MdocBuilderError } from "../types/mdocBuilderError.js";

export type CoseKey = Map<number, number | Uint8Array>;
export type DeviceKeyInfo = Map<string, CoseKey | Map<string, string[]>>;

const P256_COORDINATE_LENGTH = 32;

export function buildDeviceKeyInfo(
  spkiBytes: Uint8Array,
  namespaceNames: string[],
): DeviceKeyInfo {
  const keyObject = importSpki(spkiBytes);
  const jwk = keyObject.export({ format: "jwk" });

  if (jwk.crv !== "P-256") {
    throw new MdocBuilderError(
      `Unsupported curve: ${String(jwk.crv)}. Only P-256 ECDSA keys are supported.`,
    );
  }

  const x = padCoordinate(
    new Uint8Array(Buffer.from(jwk.x as string, "base64url")),
  );
  const y = padCoordinate(
    new Uint8Array(Buffer.from(jwk.y as string, "base64url")),
  );

  const coseKey = new Map<number, number | Uint8Array>();
  coseKey.set(1, 2);
  coseKey.set(-1, 1);
  coseKey.set(-2, x);
  coseKey.set(-3, y);

  const deviceKeyInfo: DeviceKeyInfo = new Map();
  deviceKeyInfo.set("deviceKey", coseKey);
  if (namespaceNames.length > 0) {
    const keyAuthorizations = new Map<string, string[]>();
    keyAuthorizations.set("nameSpaces", namespaceNames);
    deviceKeyInfo.set("keyAuthorizations", keyAuthorizations);
  }
  return deviceKeyInfo;
}

// RFC 9053 §7.1.1 requires coordinates to be big-endian unsigned integers of
// exactly the field size (32 bytes for P-256). If a decoded coordinate is
// shorter, it must be left-padded with zeros to preserve leading-zero octets.
export function padCoordinate(coordinate: Uint8Array): Uint8Array {
  if (coordinate.length === P256_COORDINATE_LENGTH) {
    return new Uint8Array(coordinate);
  }
  const padded = new Uint8Array(P256_COORDINATE_LENGTH);
  padded.set(coordinate, P256_COORDINATE_LENGTH - coordinate.length);
  return padded;
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
