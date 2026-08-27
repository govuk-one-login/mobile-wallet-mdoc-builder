// 1.5 MB (1.5 * 1024 * 1024) accommodates the wallet config imageMaxSize of
// 1059062 bytes (~1.01 MB) with headroom.
const ELEMENT_VALUE_MAX_BYTES = 1_572_864;

// 2 KB (2 * 1024).
const DEVICE_KEY_MAX_BYTES = 2_048;

// 8 KB (8 * 1024).
const CERTIFICATE_MAX_BYTES = 8_192;

// Largest uint32 (2^32 - 1); statusList.idx is a uint32 index.
const STATUS_LIST_IDX_MAX = 4_294_967_295;

const DOCUMENT_TYPE_MAX_LENGTH = 128;
const IDENTIFIER_MAX_LENGTH = 256;
const STRING_VALUE_MAX_LENGTH = 150;
const COLLECTION_MAX_ENTRIES = 256;
const URI_MAX_LENGTH = 2_048;

export const VALIDATION_LIMITS = {
  documentType: {
    minLength: 1,
    maxLength: DOCUMENT_TYPE_MAX_LENGTH,
  },
  nameSpaces: {
    namespaceKey: { minLength: 1, maxLength: IDENTIFIER_MAX_LENGTH },
    minDataElements: 1,
    maxDataElements: COLLECTION_MAX_ENTRIES,
    elementIdentifier: { minLength: 1, maxLength: IDENTIFIER_MAX_LENGTH },
  },
  elementValue: {
    string: { minLength: 1, maxLength: STRING_VALUE_MAX_LENGTH },
    number: {
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
    },
    uint8Array: { minByteLength: 1, maxByteLength: ELEMENT_VALUE_MAX_BYTES },
  },
  collections: {
    minLength: 1,
    maxLength: COLLECTION_MAX_ENTRIES,
  },
  deviceKey: {
    minByteLength: 1,
    maxByteLength: DEVICE_KEY_MAX_BYTES,
  },
  statusList: {
    idx: { min: 0, max: STATUS_LIST_IDX_MAX },
    uri: { maxLength: URI_MAX_LENGTH },
  },
  certificateChain: {
    minLength: 1,
    entry: { minByteLength: 1, maxByteLength: CERTIFICATE_MAX_BYTES },
  },
} as const;
