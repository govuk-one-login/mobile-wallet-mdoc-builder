import { describe, it, expect } from "vitest";
import {
  documentTypeSchema,
  deviceKeySchema,
  statusListSchema,
  certificateChainSchema,
} from "./topLevelCredentialFields.js";
import { VALIDATION_LIMITS } from "./constants.js";

describe("documentTypeSchema", () => {
  it("rejects an empty string", () => {
    expect(documentTypeSchema.safeParse("").success).toBe(false);
  });

  it("accepts a typical document type", () => {
    expect(documentTypeSchema.safeParse("org.iso.18013.5.1.mDL").success).toBe(
      true,
    );
  });

  it("accepts a value at the maximum length", () => {
    const atMax = "a".repeat(VALIDATION_LIMITS.documentType.maxLength);
    expect(documentTypeSchema.safeParse(atMax).success).toBe(true);
  });

  it("rejects a value over the maximum length", () => {
    const overMax = "a".repeat(VALIDATION_LIMITS.documentType.maxLength + 1);
    expect(documentTypeSchema.safeParse(overMax).success).toBe(false);
  });

  it("rejects a non-string", () => {
    expect(documentTypeSchema.safeParse(123).success).toBe(false);
  });
});

describe("deviceKeySchema", () => {
  it("rejects an empty Uint8Array", () => {
    expect(deviceKeySchema.safeParse(new Uint8Array([])).success).toBe(false);
  });

  it("accepts a single-byte Uint8Array", () => {
    expect(deviceKeySchema.safeParse(new Uint8Array([1])).success).toBe(true);
  });

  it("accepts a Uint8Array at the maximum byte length", () => {
    const atMax = new Uint8Array(VALIDATION_LIMITS.deviceKey.maxByteLength);
    expect(deviceKeySchema.safeParse(atMax).success).toBe(true);
  });

  it("rejects a Uint8Array over the maximum byte length", () => {
    const overMax = new Uint8Array(
      VALIDATION_LIMITS.deviceKey.maxByteLength + 1,
    );
    expect(deviceKeySchema.safeParse(overMax).success).toBe(false);
  });

  it("rejects a non-Uint8Array", () => {
    expect(deviceKeySchema.safeParse([1, 2, 3]).success).toBe(false);
  });
});

describe("statusListSchema", () => {
  const valid = { idx: 1, uri: "https://example.gov.uk/status/1" };

  it("accepts a valid status list", () => {
    expect(statusListSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts idx of zero", () => {
    expect(statusListSchema.safeParse({ ...valid, idx: 0 }).success).toBe(true);
  });

  it("accepts idx at the maximum", () => {
    expect(
      statusListSchema.safeParse({
        ...valid,
        idx: VALIDATION_LIMITS.statusList.idx.max,
      }).success,
    ).toBe(true);
  });

  it("rejects a negative idx", () => {
    expect(statusListSchema.safeParse({ ...valid, idx: -1 }).success).toBe(
      false,
    );
  });

  it("rejects a non-integer idx", () => {
    expect(statusListSchema.safeParse({ ...valid, idx: 1.5 }).success).toBe(
      false,
    );
  });

  it("rejects an idx over the maximum", () => {
    expect(
      statusListSchema.safeParse({
        ...valid,
        idx: VALIDATION_LIMITS.statusList.idx.max + 1,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid uri", () => {
    expect(
      statusListSchema.safeParse({ ...valid, uri: "not a url" }).success,
    ).toBe(false);
  });

  it("rejects a uri over the maximum length", () => {
    const longUri =
      "https://example.gov.uk/" +
      "a".repeat(VALIDATION_LIMITS.statusList.uri.maxLength);
    expect(statusListSchema.safeParse({ ...valid, uri: longUri }).success).toBe(
      false,
    );
  });

  it("rejects an unknown key", () => {
    expect(
      statusListSchema.safeParse({ ...valid, unexpected: "value" }).success,
    ).toBe(false);
  });
});

describe("certificateChainSchema", () => {
  const cert = () => new Uint8Array([1, 2, 3]);

  it("accepts a chain with one certificate", () => {
    expect(certificateChainSchema.safeParse([cert()]).success).toBe(true);
  });

  it("accepts a chain with multiple certificates", () => {
    expect(certificateChainSchema.safeParse([cert(), cert()]).success).toBe(
      true,
    );
  });

  it("rejects an empty chain", () => {
    expect(certificateChainSchema.safeParse([]).success).toBe(false);
  });

  it("rejects a chain containing an empty certificate", () => {
    expect(
      certificateChainSchema.safeParse([cert(), new Uint8Array([])]).success,
    ).toBe(false);
  });

  it("accepts a certificate at the maximum byte length", () => {
    const atMax = new Uint8Array(
      VALIDATION_LIMITS.certificateChain.entry.maxByteLength,
    );
    expect(certificateChainSchema.safeParse([atMax]).success).toBe(true);
  });

  it("rejects a certificate over the maximum byte length", () => {
    const overMax = new Uint8Array(
      VALIDATION_LIMITS.certificateChain.entry.maxByteLength + 1,
    );
    expect(certificateChainSchema.safeParse([overMax]).success).toBe(false);
  });

  it("rejects a chain containing a non-Uint8Array entry", () => {
    expect(certificateChainSchema.safeParse([cert(), [1, 2, 3]]).success).toBe(
      false,
    );
  });
});
