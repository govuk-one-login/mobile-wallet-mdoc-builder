import crypto, { webcrypto } from "node:crypto";
import { MdocBuilderError } from "../types/mdocBuilderError.js";
import { decodeAndPadCoordinate } from "./helpers/padCoordinate.js";

export type CoseKey = Map<number, number | Uint8Array>;
export type DeviceKeyInfo = Map<string, CoseKey | Map<string, string[]>>;

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
  const x = decodeAndPadCoordinate(jwk.x as string);
  const y = decodeAndPadCoordinate(jwk.y as string);

  const coseKey: CoseKey = new Map();
  coseKey.set(COSE_KEY_LABEL.KTY, COSE_KEY_VALUE.KTY_EC2);
  coseKey.set(COSE_KEY_LABEL.CRV, COSE_KEY_VALUE.CRV_P256);
  coseKey.set(COSE_KEY_LABEL.X, x);
  coseKey.set(COSE_KEY_LABEL.Y, y);
  return coseKey;
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
