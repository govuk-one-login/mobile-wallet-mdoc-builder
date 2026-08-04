import type { NameSpaces } from "../types";
import { buildSingleItem } from "./helpers/buildSingleItem.js";
import { digestItem } from "./helpers/digest.js";

export type { EncodedItem } from "./helpers/buildSingleItem.js";

export interface IssuerSignedItemResult {
  issuerSignedItemBytes: Map<string, Uint8Array[]>;
  valueDigests: Map<string, Map<number, Uint8Array>>;
}

export async function buildIssuerSignedItems(
  nameSpaces: NameSpaces,
): Promise<IssuerSignedItemResult> {
  const issuerSignedItemBytes = new Map<string, Uint8Array[]>();
  const valueDigests = new Map<string, Map<number, Uint8Array>>();

  for (const [namespace, elements] of nameSpaces) {
    const usedIds = new Set<number>();
    const itemBytes: Uint8Array[] = [];
    const digests = new Map<number, Uint8Array>();

    for (const element of elements) {
      const { digestId, tag24Bytes } = buildSingleItem(element, usedIds);
      const digest = await digestItem(tag24Bytes);

      itemBytes.push(tag24Bytes);
      digests.set(digestId, digest);
    }

    issuerSignedItemBytes.set(namespace, itemBytes);
    valueDigests.set(namespace, digests);
  }

  return { issuerSignedItemBytes, valueDigests };
}
