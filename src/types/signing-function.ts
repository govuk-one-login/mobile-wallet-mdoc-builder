/**
 * A function that signs the provided data and returns the signature.
 *
 * @param toBeSigned - The bytes to be signed.
 * @returns A promise resolving to the signature bytes.
 */
export type SigningFunction = (toBeSigned: Uint8Array) => Promise<Uint8Array>;
