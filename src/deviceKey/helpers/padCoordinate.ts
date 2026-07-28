const P256_COORDINATE_LENGTH = 32;

export function decodeAndPadCoordinate(base64url: string): Uint8Array {
  return padCoordinate(new Uint8Array(Buffer.from(base64url, "base64url")));
}

// RFC 9053 §7.1.1 requires coordinates to be big-endian unsigned integers of
// exactly the field size (32 bytes for P-256). If a decoded coordinate is
// shorter, it must be left-padded with zeros to preserve leading-zero octets.
function padCoordinate(coordinate: Uint8Array): Uint8Array {
  if (coordinate.length === P256_COORDINATE_LENGTH) {
    return new Uint8Array(coordinate);
  }
  const padded = new Uint8Array(P256_COORDINATE_LENGTH);
  padded.set(coordinate, P256_COORDINATE_LENGTH - coordinate.length);
  return padded;
}
