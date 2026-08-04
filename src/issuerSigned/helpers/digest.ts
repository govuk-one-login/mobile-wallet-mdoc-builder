export async function digestItem(tag24Bytes: Uint8Array): Promise<Uint8Array> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    tag24Bytes as Uint8Array<ArrayBuffer>,
  );
  return new Uint8Array(buffer);
}
