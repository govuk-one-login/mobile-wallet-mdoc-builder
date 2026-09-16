import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEncode = vi.fn<(value: unknown) => Uint8Array>();

vi.mock("../cbor/index.js", () => ({
  encode: (value: unknown) => mockEncode(value),
}));

const { buildToBeSigned } = await import("./buildToBeSigned.js");

describe("buildToBeSigned", () => {
  const protectedHeader = new Uint8Array([0xa1, 0x01, 0x26]);
  const payload = new Uint8Array([0xd8, 0x18, 0x41, 0x00]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockEncode.mockReturnValue(new Uint8Array([0x99]));
  });

  it("returns the bytes produced by encode", () => {
    const encoded = new Uint8Array([0x01, 0x02, 0x03]);
    mockEncode.mockReturnValue(encoded);

    const result = buildToBeSigned(protectedHeader, payload);

    expect(result).toBe(encoded);
  });

  it("calls encode once", () => {
    buildToBeSigned(protectedHeader, payload);

    expect(mockEncode).toHaveBeenCalledTimes(1);
  });

  it("passes a four-element Sig_Structure array to encode", () => {
    buildToBeSigned(protectedHeader, payload);

    const arg = mockEncode.mock.calls[0]?.[0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg).toHaveLength(4);
  });

  it('uses the "Signature1" context string as the first element', () => {
    buildToBeSigned(protectedHeader, payload);

    const arg = mockEncode.mock.calls[0]?.[0] as unknown[];
    expect(arg[0]).toBe("Signature1");
  });

  it("uses the protected header bytes as the second element", () => {
    buildToBeSigned(protectedHeader, payload);

    const arg = mockEncode.mock.calls[0]?.[0] as unknown[];
    expect(arg[1]).toBe(protectedHeader);
  });

  it("uses an empty byte string as the third element (external AAD)", () => {
    buildToBeSigned(protectedHeader, payload);

    const arg = mockEncode.mock.calls[0]?.[0] as unknown[];
    expect(arg[2]).toBeInstanceOf(Uint8Array);
    expect(arg[2]).toHaveLength(0);
  });

  it("uses the MSO bytes as the fourth element (payload)", () => {
    buildToBeSigned(protectedHeader, payload);

    const arg = mockEncode.mock.calls[0]?.[0] as unknown[];
    expect(arg[3]).toBe(payload);
  });
});
