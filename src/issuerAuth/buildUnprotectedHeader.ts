const COSE_HEADER_X5CHAIN = 33; // x5chain header label

export function buildUnprotectedHeader(
  certificateChain: [Uint8Array, ...Uint8Array[]],
): Map<number, Uint8Array> {
  // Only the leaf (signing) certificate is included - full chain support is out of scope for now.
  const [signingCertificate] = certificateChain;

  return new Map<number, Uint8Array>([
    [COSE_HEADER_X5CHAIN, signingCertificate],
  ]);
}
