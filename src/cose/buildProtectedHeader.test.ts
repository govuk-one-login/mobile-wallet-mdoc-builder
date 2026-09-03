import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEncode = vi.fn<(value: unknown) => Uint8Array>();

vi.mock("../cbor/index.js", () => ({
  encode: (value: unknown) => mockEncode(value),
}));

const { buildProtectedHeader } = await import("./buildProtectedHeader.js");

describe("buildProtectedHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEncode.mockReturnValue(new Uint8Array([0xa1, 0x01, 0x26]));
  });

  it("encodes a map containing only the alg (1) header set to ES256 (-7)", () => {
    buildProtectedHeader();

    expect(mockEncode).toHaveBeenCalledTimes(1);
    const encoded = mockEncode.mock.calls[0]?.[0];
    expect(encoded).toBeInstanceOf(Map);
    expect(encoded).toEqual(new Map<number, number>([[1, -7]]));
  });

  it("returns the CBOR-encoded bytes produced by the encoder", () => {
    const result = buildProtectedHeader();

    expect(result).toEqual(new Uint8Array([0xa1, 0x01, 0x26]));
  });
});
