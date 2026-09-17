import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SigningFunction } from "../types";
import { MdocBuilderError } from "../types";

const protectedHeader = new Uint8Array([0xa1, 0x01, 0x26]);
const unprotectedHeader = new Map<number, Uint8Array>([
  [33, new Uint8Array([0x01, 0x02, 0x03])],
]);
const toBeSigned = new Uint8Array([0x84, 0x6a, 0x53, 0x69]);

const mockBuildProtectedHeader = vi.fn<() => Uint8Array>();
const mockBuildUnprotectedHeader =
  vi.fn<(chain: [Uint8Array, ...Uint8Array[]]) => Map<number, Uint8Array>>();
const mockBuildToBeSigned =
  vi.fn<(protectedHeader: Uint8Array, payload: Uint8Array) => Uint8Array>();

vi.mock("./buildProtectedHeader.js", () => ({
  buildProtectedHeader: () => mockBuildProtectedHeader(),
}));

vi.mock("./buildUnprotectedHeader.js", () => ({
  buildUnprotectedHeader: (chain: [Uint8Array, ...Uint8Array[]]) =>
    mockBuildUnprotectedHeader(chain),
}));

vi.mock("./buildToBeSigned.js", () => ({
  buildToBeSigned: (header: Uint8Array, payload: Uint8Array) =>
    mockBuildToBeSigned(header, payload),
}));

const { assembleIssuerAuth } = await import("./assembleIssuerAuth.js");

describe("assembleIssuerAuth", () => {
  const msoBytes = new Uint8Array([0xd8, 0x18, 0x41, 0x00]);
  const certificateChain: [Uint8Array, ...Uint8Array[]] = [
    new Uint8Array([0x0a, 0x0b, 0x0c]),
  ];
  const signature = new Uint8Array(64).fill(0xab);

  const makeSign = (): SigningFunction =>
    vi.fn<SigningFunction>().mockResolvedValue(signature);

  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildProtectedHeader.mockReturnValue(protectedHeader);
    mockBuildUnprotectedHeader.mockReturnValue(unprotectedHeader);
    mockBuildToBeSigned.mockReturnValue(toBeSigned);
  });

  it("builds the protected header", async () => {
    await assembleIssuerAuth(msoBytes, certificateChain, makeSign());

    expect(mockBuildProtectedHeader).toHaveBeenCalledTimes(1);
  });

  it("builds the unprotected header from the certificate chain", async () => {
    await assembleIssuerAuth(msoBytes, certificateChain, makeSign());

    expect(mockBuildUnprotectedHeader).toHaveBeenCalledTimes(1);
    expect(mockBuildUnprotectedHeader).toHaveBeenCalledWith(certificateChain);
  });

  it("builds toBeSigned from the protected header and the MSO bytes", async () => {
    await assembleIssuerAuth(msoBytes, certificateChain, makeSign());

    expect(mockBuildToBeSigned).toHaveBeenCalledTimes(1);
    expect(mockBuildToBeSigned).toHaveBeenCalledWith(protectedHeader, msoBytes);
  });

  it("calls the signing function once with toBeSigned", async () => {
    const sign = makeSign();

    await assembleIssuerAuth(msoBytes, certificateChain, sign);

    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(toBeSigned);
  });

  it("returns the four-element COSE_Sign1 array [protectedHeader, unprotectedHeader, msoBytes, signature]", async () => {
    const result = await assembleIssuerAuth(
      msoBytes,
      certificateChain,
      makeSign(),
    );

    expect(result).toHaveLength(4);
    expect(result[0]).toBe(protectedHeader);
    expect(result[1]).toBe(unprotectedHeader);
    expect(result[2]).toBe(msoBytes);
    expect(result[3]).toBe(signature);
  });

  it("wraps errors thrown by the signing function in an MdocBuilderError with cause", async () => {
    const error = new Error("signing backend unavailable");
    const sign = vi.fn<SigningFunction>().mockRejectedValue(error);

    const promise = assembleIssuerAuth(msoBytes, certificateChain, sign);

    await expect(promise).rejects.toBeInstanceOf(MdocBuilderError);
    await expect(promise).rejects.toMatchObject({ cause: error });
  });

  it("throws an MdocBuilderError when the signature is not a Uint8Array", async () => {
    const sign = vi
      .fn<SigningFunction>()
      .mockResolvedValue("not-bytes" as unknown as Uint8Array);

    await expect(
      assembleIssuerAuth(msoBytes, certificateChain, sign),
    ).rejects.toThrow(MdocBuilderError);
  });

  it("throws an MdocBuilderError when the signature is not 64 bytes", async () => {
    const sign = vi
      .fn<SigningFunction>()
      .mockResolvedValue(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));

    await expect(
      assembleIssuerAuth(msoBytes, certificateChain, sign),
    ).rejects.toThrow(MdocBuilderError);
  });
});
