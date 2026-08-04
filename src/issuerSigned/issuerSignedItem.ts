import { randomBytes } from "node:crypto";
import {
  encode,
  embeddedCbor,
  tdate,
  fullDate,
  TaggedValue,
} from "../cbor/index.js";
import type { DataElement, NameSpaces } from "../types";
import { DateFormat } from "../types";
import { digestItem } from "./helpers/digest.js";

export interface IssuerSignedItemResult {
  issuerSignedItemBytes: Map<string, Uint8Array[]>;
  valueDigests: Map<string, Map<number, Uint8Array>>;
}

const SALT_LENGTH_BYTES = 16;
const MAX_DIGEST_ID = 2_147_483_647; // 2^31 - 1

function generateDigestId(existingIds: Set<number>): number {
  let id: number;
  do {
    const bytes = randomBytes(4);
    id = bytes.readUInt32BE(0) >>> 1;
  } while (id > MAX_DIGEST_ID || existingIds.has(id));
  return id;
}

function encodeElementValue(element: DataElement): unknown {
  const { elementValue, dateFormat } = element;

  if (elementValue instanceof Date) {
    return encodeDateValue(elementValue, dateFormat);
  }

  if (Array.isArray(elementValue)) {
    return elementValue.map((item) => {
      if (item instanceof Date) {
        return encodeDateValue(item, dateFormat);
      }
      return item;
    });
  }

  return elementValue;
}

function encodeDateValue(date: Date, dateFormat?: DateFormat): TaggedValue {
  if (dateFormat === DateFormat.FullDate) {
    const year = date.getUTCFullYear().toString().padStart(4, "0");
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return fullDate(`${year}-${month}-${day}`);
  }

  return tdate(date);
}

interface EncodedItem {
  digestId: number;
  tag24Bytes: Uint8Array;
}

export function buildSingleItem(
  element: DataElement,
  usedIds: Set<number>,
): EncodedItem {
  const digestId = generateDigestId(usedIds);
  usedIds.add(digestId);

  const salt = new Uint8Array(randomBytes(SALT_LENGTH_BYTES));

  const issuerSignedItem = new Map<string, unknown>([
    ["digestID", digestId],
    ["random", salt],
    ["elementIdentifier", element.elementIdentifier],
    ["elementValue", encodeElementValue(element)],
  ]);

  const innerBytes = encode(issuerSignedItem);
  const tag24Bytes = encode(embeddedCbor(innerBytes));

  return { digestId, tag24Bytes };
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
