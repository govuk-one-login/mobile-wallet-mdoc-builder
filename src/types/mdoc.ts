/**
 * A built mdoc document with multiple output format options.
 */
export interface Mdoc {
  /** Returns the mdoc encoded as a base64url string. */
  asBase64Url(): string;

  /** Returns the mdoc encoded as a hexadecimal string. */
  asHex(): string;

  /** Returns the mdoc as raw bytes. */
  asBytes(): Uint8Array;
}
