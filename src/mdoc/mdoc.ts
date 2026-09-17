import type { Mdoc } from "../types";

/**
 * Wraps the raw CBOR-encoded IssuerSigned bytes and exposes them in the
 * output formats a caller may need.
 *
 * This is a thin wrapper: the bytes are stored as-is with no validation and
 * no defensive copy. All three accessors return representations of the same
 * underlying bytes.
 */
export class MdocOutput implements Mdoc {
  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  /** Returns the mdoc encoded as an unpadded base64url string. */
  asBase64Url(): string {
    return Buffer.from(this.bytes).toString("base64url");
  }

  /** Returns the mdoc encoded as a lowercase hexadecimal string. */
  asHex(): string {
    return Buffer.from(this.bytes).toString("hex");
  }

  /** Returns the mdoc as raw bytes. */
  asBytes(): Uint8Array {
    return this.bytes;
  }
}
