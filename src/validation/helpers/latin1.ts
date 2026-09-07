// Latin-1 (ISO/IEC 8859-1) is the single-byte character set: characters 0-255.
// The pattern matches only those and rejects any character with a higher value.
const LATIN1_PATTERN = /^[\u0000-\u00FF]*$/;

export const LATIN1_MESSAGE =
  "must contain only Latin1 (ISO/IEC 8859-1) characters";

export function isLatin1(value: string): boolean {
  return LATIN1_PATTERN.test(value);
}
