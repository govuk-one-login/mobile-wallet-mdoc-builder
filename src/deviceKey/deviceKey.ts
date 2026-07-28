import crypto, { webcrypto } from "node:crypto";
import { MdocBuilderError } from "../types/mdocBuilderError.js";

export type CoseKey = Map<number, number | Uint8Array>;
export type DeviceKeyInfo = Map<string, CoseKey | Map<string, string[]>>;

const P256_COORDINATE_LENGTH = 32;

const COSE_KEY_LABEL = {
  /** Key Type (kty) */
  KTY: 1,
  /** EC Curve (crv) */
  CRV: -1,
  /** x-coordinate */
  X: -2,
  /** y-coordinate */
  Y: -3,
} as const;

const COSE_KEY_VALUE = {
  /** Key type: Elliptic Curve (EC2) */
  KTY_EC2: 2,
  /** Curve: P-256 */
  CRV_P256: 1,
} as const;

const DEVICE_KEY_INFO_KEY = {
  DEVICE_KEY: "deviceKey",
  KEY_AUTHORIZATIONS: "keyAuthorizations",
  NAME_SPACES: "nameSpaces",
} as const;

export function buildDeviceKeyInfo(
  spkiBytes: Uint8Array,
  namespaceNames: string[],
): DeviceKeyInfo {
  const keyObject = importSpki(spkiBytes);
  const jwk = keyObject.export({ format: "jwk" });

  if (jwk.kty !== "EC") {
    throw new MdocBuilderError(
      `Unsupported key type: ${String(jwk.kty)}. Only EC keys are supported.`,
    );
  }

  if (jwk.crv !== "P-256") {
    throw new MdocBuilderError(
      `Unsupported curve: ${String(jwk.crv)}. Only P-256 is supported.`,
    );
  }

  const coseKey = buildCoseKey(jwk);

  const deviceKeyInfo: DeviceKeyInfo = new Map();
  deviceKeyInfo.set(DEVICE_KEY_INFO_KEY.DEVICE_KEY, coseKey);
  if (namespaceNames.length > 0) {
    const keyAuthorizations = new Map<string, string[]>();
    keyAuthorizations.set(DEVICE_KEY_INFO_KEY.NAME_SPACES, namespaceNames);
    deviceKeyInfo.set(
      DEVICE_KEY_INFO_KEY.KEY_AUTHORIZATIONS,
      keyAuthorizations,
    );
  }
  return deviceKeyInfo;
}

function buildCoseKey(jwk: webcrypto.JsonWebKey): CoseKey {
  const x = decodeCoordinate(jwk.x as string);
  const y = decodeCoordinate(jwk.y as string);

  const coseKey: CoseKey = new Map();
  coseKey.set(COSE_KEY_LABEL.KTY, COSE_KEY_VALUE.KTY_EC2);
  coseKey.set(COSE_KEY_LABEL.CRV, COSE_KEY_VALUE.CRV_P256);
  coseKey.set(COSE_KEY_LABEL.X, x);
  coseKey.set(COSE_KEY_LABEL.Y, y);
  return coseKey;
}

function decodeCoordinate(base64url: string): Uint8Array {
  return padCoordinate(new Uint8Array(Buffer.from(base64url, "base64url")));
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
    throw new MdocBuilderError(`Failed to import SPKI key: ${message}`, {
      cause: error,
    });
  }
}
