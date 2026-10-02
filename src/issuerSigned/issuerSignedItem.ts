import type { NameSpaces } from "../types";
import { buildSingleItem } from "./buildSingleItem";
import { digestItem } from "./helpers/digest.js";

export interface IssuerSignedItemResult {
  issuerSignedItemBytes: Map<string, Uint8Array[]>;
  valueDigests: Map<string, Map<number, Uint8Array>>;
}

export async function buildIssuerSignedItems(
  nameSpaces: NameSpaces,
): Promise<IssuerSignedItemResult> {
  const issuerSignedItemBytes = new Map<string, Uint8Array[]>();
  const valueDigests = new Map<string, Map<number, Uint8Array>>();

  const namespaceResults = await Promise.all(
    [...nameSpaces].map(async ([namespace, elements]) => {
      const usedIds = new Set<number>();

      const items = elements.map((element) =>
        buildSingleItem(element, usedIds),
      );

      const digestEntries = await Promise.all(
        items.map(
          async ({ digestId, tag24Bytes }) =>
            [digestId, await digestItem(tag24Bytes)] as const,
        ),
      );

      const itemBytes = items.map(({ tag24Bytes }) => tag24Bytes);
      const digests = new Map<number, Uint8Array>(digestEntries);

      return { namespace, itemBytes, digests } as const;
    }),
  );

  for (const { namespace, itemBytes, digests } of namespaceResults) {
    issuerSignedItemBytes.set(namespace, itemBytes);
    valueDigests.set(namespace, digests);
  }

  return { issuerSignedItemBytes, valueDigests };
}
