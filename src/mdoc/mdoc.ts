import type { Mdoc } from "../types";

export class MdocOutput implements Mdoc {
  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = Uint8Array.from(bytes);
  }

  asBase64Url(): string {
    return Buffer.from(this.bytes).toString("base64url");
  }

  asHex(): string {
    return Buffer.from(this.bytes).toString("hex");
  }

  asBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}
