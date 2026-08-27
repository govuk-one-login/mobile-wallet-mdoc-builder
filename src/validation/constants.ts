export const VALIDATION_LIMITS = {
  documentType: {
    minLength: 1,
    maxLength: 128,
  },
  nameSpaces: {
    namespaceKey: { minLength: 1, maxLength: 256 },
    minDataElements: 1,
    maxDataElements: 256,
    elementIdentifier: { minLength: 1, maxLength: 256 },
  },
  elementValue: {
    string: { minLength: 1, maxLength: 150 },
    number: {
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
    },
    uint8Array: { minByteLength: 1, maxByteLength: 1572864 },
  },
  collections: {
    minLength: 1,
    maxLength: 256,
  },
  deviceKey: {
    minByteLength: 1,
    maxByteLength: 2048,
  },
  statusList: {
    idx: { min: 0, max: 4294967295 },
    uri: { maxLength: 2048 },
  },
  certificateChain: {
    minLength: 1,
    entry: { minByteLength: 1, maxByteLength: 8192 },
  },
} as const;
