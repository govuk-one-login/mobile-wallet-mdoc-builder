import { describe, expect, it, vi } from "vitest";
import { assembleIssuerAuth } from "./assembleIssuerAuth.js";
import type { SigningFunction } from "../types";
import { MdocBuilderError } from "../types";

describe("assembleIssuerAuth", () => {
  const toBeSigned = new Uint8Array([0x84, 0x6a, 0x53, 0x69]);
  const protectedHeader = new Uint8Array([0xa1, 0x01, 0x26]);
  const msoBytes = new Uint8Array([0xd8, 0x18, 0x41, 0x00]);
  const unprotectedHeader = new Map<number, Uint8Array>([
    [33, new Uint8Array([0x01, 0x02, 0x03])],
  ]);
  const signature = new Uint8Array(64).fill(0xab);

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

  it("wraps errors thrown by the signing function in an MdocBuilderError with cause", async () => {
    const error = new Error("signing backend unavailable");
    const sign = vi.fn<SigningFunction>().mockRejectedValue(error);

    const promise = assembleIssuerAuth(
      toBeSigned,
      protectedHeader,
      msoBytes,
      unprotectedHeader,
      sign,
    );

    await expect(promise).rejects.toBeInstanceOf(MdocBuilderError);
    await expect(promise).rejects.toMatchObject({ cause: error });
  });

  it("throws an MdocBuilderError when the signature is not a Uint8Array", async () => {
    const sign = vi
      .fn<SigningFunction>()
      .mockResolvedValue("not-bytes" as unknown as Uint8Array);

    await expect(
      assembleIssuerAuth(
        toBeSigned,
        protectedHeader,
        msoBytes,
        unprotectedHeader,
        sign,
      ),
    ).rejects.toThrow(MdocBuilderError);
  });

  it("throws an MdocBuilderError when the signature is not 64 bytes", async () => {
    const sign = vi
      .fn<SigningFunction>()
      .mockResolvedValue(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));

    await expect(
      assembleIssuerAuth(
        toBeSigned,
        protectedHeader,
        msoBytes,
        unprotectedHeader,
        sign,
      ),
    ).rejects.toThrow(MdocBuilderError);
  });
});
