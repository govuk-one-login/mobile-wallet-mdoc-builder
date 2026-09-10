import { describe, expect, it, vi } from "vitest";
import { assembleIssuerAuth } from "./assembleIssuerAuth.js";
import type { SigningFunction } from "../types";

describe("assembleIssuerAuth", () => {
  const toBeSigned = new Uint8Array([0x84, 0x6a, 0x53, 0x69]);
  const protectedHeader = new Uint8Array([0xa1, 0x01, 0x26]);
  const msoBytes = new Uint8Array([0xd8, 0x18, 0x41, 0x00]);
  const unprotectedHeader = new Map<number, Uint8Array>([
    [33, new Uint8Array([0x01, 0x02, 0x03])],
  ]);
  const signature = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

  const makeSign = (): SigningFunction =>
    vi.fn<SigningFunction>().mockResolvedValue(signature);

  it("calls the signing function once with toBeSigned", async () => {
    const sign = makeSign();

    await assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      sign,
    );

    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(toBeSigned);
  });

  it("returns a four-element COSE_Sign1 array", async () => {
    const result = await assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      makeSign(),
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(4);
  });

  it("places the protected header bytes as the first element", async () => {
    const result = await assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      makeSign(),
    );

    expect(result[0]).toBe(protectedHeader);
  });

  it("places the unprotected header map as the second element", async () => {
    const result = await assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      makeSign(),
    );

    expect(result[1]).toBe(unprotectedHeader);
  });

  it("places the Tag 24 wrapped MSO bytes as the third element (payload)", async () => {
    const result = await assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      makeSign(),
    );

    expect(result[2]).toBe(msoBytes);
  });

  it("places the signature bytes from the callback as the fourth element", async () => {
    const result = await assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      makeSign(),
    );

    expect(result[3]).toBe(signature);
  });

  it("returns a plain JS structure and does not CBOR-encode it", async () => {
    const result = await assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      makeSign(),
    );

    // A plain array whose elements are the exact inputs/outputs, not encoded bytes.
    expect(result).toEqual([
      protectedHeader,
      unprotectedHeader,
      msoBytes,
      signature,
    ]);
  });

  it("propagates errors thrown by the signing function without catching them", async () => {
    const error = new Error("signing backend unavailable");
    const sign = vi.fn<SigningFunction>().mockRejectedValue(error);

    await expect(
      assembleIssuerAuth(
        toBeSigned,
        protectedHeader,
        msoBytes,
        unprotectedHeader,
        sign,
      ),
    ).rejects.toBe(error);
  });
});
