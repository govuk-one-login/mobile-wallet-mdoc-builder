// Latin-1 (ISO/IEC 8859-1, Latin alphabet No. 1) is the 8-bit character set
// covering code points U+0000–U+00FF. ISO 18013-5 requires string values to
// use only Latin-1 characters. The character class below rejects any code
// point above U+00FF, including surrogate pairs / astral-plane characters,
// because those encode code points greater than 0xFF.
const LATIN1_PATTERN = /^[\u0000-\u00FF]*$/;

export const LATIN1_MESSAGE =
  "must contain only Latin1 (ISO/IEC 8859-1) characters";

export function isLatin1(value: string): boolean {
  return LATIN1_PATTERN.test(value);
}
