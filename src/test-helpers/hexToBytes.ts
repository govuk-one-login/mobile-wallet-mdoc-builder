/**
 * Convert a hex string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, "hex"));
}
