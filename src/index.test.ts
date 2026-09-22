import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MdocBuilderInput, SigningFunction } from "./index.js";
import type { ValidationError } from "./validation";
import type { IssuerSignedItemResult } from "./issuerSigned";
import type { DeviceKeyInfo } from "./deviceKey";
import type { ValidityInfo } from "./validityInfo";
import type { IssuerAuth } from "./issuerAuth";

const mockValidate = vi.fn<(input: unknown) => ValidationError[]>();
const mockBuildDeviceKeyInfo =
  vi.fn<(spki: Uint8Array, names: string[]) => DeviceKeyInfo>();
const mockBuildIssuerSignedItems =
  vi.fn<(nameSpaces: unknown) => Promise<IssuerSignedItemResult>>();
const mockBuildValidityInfo = vi.fn<(input: unknown) => ValidityInfo>();
const mockBuildMso = vi.fn<(input: unknown) => Uint8Array>();
const mockAssembleIssuerAuth =
  vi.fn<
    (
      mso: Uint8Array,
      chain: Uint8Array[],
      sign: SigningFunction,
    ) => Promise<IssuerAuth>
  >();
const mockAssembleIssuerSigned =
  vi.fn<(items: unknown, issuerAuth: unknown) => Uint8Array>();
const mockMdocOutput = vi.fn<(bytes: Uint8Array) => void>();

vi.mock("./validation/index.js", () => ({
  validateMdocBuilderInput: (input: unknown) => mockValidate(input),
}));
vi.mock("./deviceKey/index.js", () => ({
  buildDeviceKeyInfo: (spki: Uint8Array, names: string[]) =>
    mockBuildDeviceKeyInfo(spki, names),
}));
vi.mock("./issuerSigned/index.js", () => ({
  buildIssuerSignedItems: (nameSpaces: unknown) =>
    mockBuildIssuerSignedItems(nameSpaces),
  assembleIssuerSigned: (items: unknown, issuerAuth: unknown) =>
    mockAssembleIssuerSigned(items, issuerAuth),
}));
vi.mock("./validityInfo/index.js", () => ({
  buildValidityInfo: (input: unknown) => mockBuildValidityInfo(input),
}));
vi.mock("./mso/index.js", () => ({
  buildMso: (input: unknown) => mockBuildMso(input),
}));
vi.mock("./issuerAuth/index.js", () => ({
  assembleIssuerAuth: (
    mso: Uint8Array,
    chain: Uint8Array[],
    sign: SigningFunction,
  ) => mockAssembleIssuerAuth(mso, chain, sign),
}));
vi.mock("./mdoc/index.js", () => ({
  MdocOutput: class {
    constructor(bytes: Uint8Array) {
      mockMdocOutput(bytes);
      this.bytes = bytes;
    }
    bytes: Uint8Array;
    asBytes() {
      return this.bytes;
    }
    asHex() {
      return "hex";
    }
    asBase64Url() {
      return "b64u";
    }
  },
}));

const { buildMdoc, MdocBuilderError } = await import("./index.js");

const DEVICE_KEY = new Uint8Array([0x01, 0x02]);
const CERT = new Uint8Array([0xaa, 0xbb]);
const ITEM_BYTES = new Map<string, Uint8Array[]>([
  ["org.iso.18013.5.1", [new Uint8Array([0x11])]],
]);
const VALUE_DIGESTS = new Map<string, Map<number, Uint8Array>>([
  ["org.iso.18013.5.1", new Map([[1, new Uint8Array([0x22])]])],
]);
const DEVICE_KEY_INFO = new Map() as DeviceKeyInfo;
const VALIDITY_INFO: ValidityInfo = {
  signed: new Date("2024-01-01T00:00:00Z"),
  validFrom: new Date("2024-01-01T00:00:00Z"),
  validUntil: new Date("2025-01-01T00:00:00Z"),
};
const MSO_BYTES = new Uint8Array([0xd8, 0x18, 0x41, 0x00]);
const ISSUER_AUTH: IssuerAuth = [
  new Uint8Array([0xa1, 0x01, 0x26]),
  new Map<number, Uint8Array>([[33, CERT]]),
  MSO_BYTES,
  new Uint8Array(64).fill(0x11),
];
const ASSEMBLED = new Uint8Array([0xca, 0xfe]);

function makeInput(): MdocBuilderInput {
  return {
    documentType: "org.iso.18013.5.1.mDL",
    nameSpaces: new Map([
      [
        "org.iso.18013.5.1",
        [{ elementIdentifier: "family_name", elementValue: "Doe" }],
      ],
      ["uk.gov.wallet.1", [{ elementIdentifier: "foo", elementValue: 1 }]],
    ]),
    deviceKey: DEVICE_KEY,
    credentialValidity: { validUntil: new Date("2025-01-01T00:00:00Z") },
    statusList: { idx: 5, uri: "https://status.example/list" },
    certificateChain: [CERT],
  };
}

const sign: SigningFunction = () => Promise.resolve(new Uint8Array(64));

describe("buildMdoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidate.mockReturnValue([]);
    mockBuildDeviceKeyInfo.mockReturnValue(DEVICE_KEY_INFO);
    mockBuildIssuerSignedItems.mockResolvedValue({
      issuerSignedItemBytes: ITEM_BYTES,
      valueDigests: VALUE_DIGESTS,
    });
    mockBuildValidityInfo.mockReturnValue(VALIDITY_INFO);
    mockBuildMso.mockReturnValue(MSO_BYTES);
    mockAssembleIssuerAuth.mockResolvedValue(ISSUER_AUTH);
    mockAssembleIssuerSigned.mockReturnValue(ASSEMBLED);
  });

  describe("delegation", () => {
    it("calls validateMdocBuilderInput with the input", async () => {
      const input = makeInput();
      await buildMdoc(input, sign);
      expect(mockValidate).toHaveBeenCalledWith(input);
    });

    it("calls buildDeviceKeyInfo with deviceKey and namespace keys", async () => {
      const input = makeInput();
      await buildMdoc(input, sign);
      expect(mockBuildDeviceKeyInfo).toHaveBeenCalledWith(DEVICE_KEY, [
        "org.iso.18013.5.1",
        "uk.gov.wallet.1",
      ]);
    });

    it("calls buildIssuerSignedItems with the nameSpaces", async () => {
      const input = makeInput();
      await buildMdoc(input, sign);
      expect(mockBuildIssuerSignedItems).toHaveBeenCalledWith(input.nameSpaces);
    });

    it("calls buildValidityInfo with the credentialValidity", async () => {
      const input = makeInput();
      await buildMdoc(input, sign);
      expect(mockBuildValidityInfo).toHaveBeenCalledWith(
        input.credentialValidity,
      );
    });

    it("calls buildMso mapping documentType to docType with correct sources", async () => {
      const input = makeInput();
      await buildMdoc(input, sign);
      expect(mockBuildMso).toHaveBeenCalledWith({
        docType: "org.iso.18013.5.1.mDL",
        valueDigests: VALUE_DIGESTS,
        deviceKeyInfo: DEVICE_KEY_INFO,
        validityInfo: VALIDITY_INFO,
        statusList: input.statusList,
      });
    });

    it("calls assembleIssuerAuth with MSO bytes, certificate chain, and sign", async () => {
      const input = makeInput();
      await buildMdoc(input, sign);
      expect(mockAssembleIssuerAuth).toHaveBeenCalledWith(
        MSO_BYTES,
        input.certificateChain,
        sign,
      );
    });

    it("calls assembleIssuerSigned with item bytes and issuerAuth", async () => {
      await buildMdoc(makeInput(), sign);
      expect(mockAssembleIssuerSigned).toHaveBeenCalledWith(
        ITEM_BYTES,
        ISSUER_AUTH,
      );
    });

    it("wraps the assembled bytes in a MdocOutput", async () => {
      await buildMdoc(makeInput(), sign);
      expect(mockMdocOutput).toHaveBeenCalledWith(ASSEMBLED);
    });
  });

  describe("ordering", () => {
    it("invokes components in the documented order, validity immediately before MSO", async () => {
      const order: string[] = [];
      mockValidate.mockImplementation(() => {
        order.push("validate");
        return [];
      });
      mockBuildDeviceKeyInfo.mockImplementation(() => {
        order.push("deviceKey");
        return DEVICE_KEY_INFO;
      });
      mockBuildIssuerSignedItems.mockImplementation(() => {
        order.push("issuerSignedItems");
        return Promise.resolve({
          issuerSignedItemBytes: ITEM_BYTES,
          valueDigests: VALUE_DIGESTS,
        });
      });
      mockBuildValidityInfo.mockImplementation(() => {
        order.push("validityInfo");
        return VALIDITY_INFO;
      });
      mockBuildMso.mockImplementation(() => {
        order.push("mso");
        return MSO_BYTES;
      });
      mockAssembleIssuerAuth.mockImplementation(() => {
        order.push("issuerAuth");
        return Promise.resolve(ISSUER_AUTH);
      });
      mockAssembleIssuerSigned.mockImplementation(() => {
        order.push("issuerSigned");
        return ASSEMBLED;
      });

      await buildMdoc(makeInput(), sign);

      expect(order).toEqual([
        "validate",
        "deviceKey",
        "issuerSignedItems",
        "validityInfo",
        "mso",
        "issuerAuth",
        "issuerSigned",
      ]);
    });
  });

  describe("return value", () => {
    it("returns an object satisfying the Mdoc interface", async () => {
      const result = await buildMdoc(makeInput(), sign);
      expect(result.asBytes()).toBe(ASSEMBLED);
      expect(typeof result.asHex()).toBe("string");
      expect(typeof result.asBase64Url()).toBe("string");
    });
  });

  it("exports MdocBuilderError", () => {
    expect(new MdocBuilderError("x")).toBeInstanceOf(Error);
  });

  describe("validation errors", () => {
    it("rejects with MdocBuilderError when validation returns violations", async () => {
      mockValidate.mockReturnValue([
        { field: "documentType", message: "must not be empty" },
      ]);

      await expect(buildMdoc(makeInput(), sign)).rejects.toThrow(
        MdocBuilderError,
      );
    });

    it("aggregates all field: message pairs into the error message", async () => {
      mockValidate.mockReturnValue([
        { field: "documentType", message: "must not be empty" },
        { field: "statusList.idx", message: "must be non-negative" },
      ]);

      await expect(buildMdoc(makeInput(), sign)).rejects.toThrow(
        "documentType: must not be empty; statusList.idx: must be non-negative",
      );
    });

    it("does not call any downstream component when validation fails", async () => {
      mockValidate.mockReturnValue([
        { field: "documentType", message: "must not be empty" },
      ]);

      await expect(buildMdoc(makeInput(), sign)).rejects.toThrow(
        MdocBuilderError,
      );

      expect(mockBuildDeviceKeyInfo).not.toHaveBeenCalled();
      expect(mockBuildIssuerSignedItems).not.toHaveBeenCalled();
      expect(mockBuildValidityInfo).not.toHaveBeenCalled();
      expect(mockBuildMso).not.toHaveBeenCalled();
      expect(mockAssembleIssuerAuth).not.toHaveBeenCalled();
      expect(mockAssembleIssuerSigned).not.toHaveBeenCalled();
      expect(mockMdocOutput).not.toHaveBeenCalled();
    });
  });

  describe("error propagation", () => {
    it("propagates an error thrown by buildDeviceKeyInfo", async () => {
      const error = new Error("device key import failed");
      mockBuildDeviceKeyInfo.mockImplementation(() => {
        throw error;
      });

      await expect(buildMdoc(makeInput(), sign)).rejects.toBe(error);
    });

    it("propagates a rejection from buildIssuerSignedItems", async () => {
      const error = new Error("item build failed");
      mockBuildIssuerSignedItems.mockRejectedValue(error);

      await expect(buildMdoc(makeInput(), sign)).rejects.toBe(error);
    });

    it("propagates a rejection from assembleIssuerAuth (signing failure)", async () => {
      const error = new Error("signing failed");
      mockAssembleIssuerAuth.mockRejectedValue(error);

      await expect(buildMdoc(makeInput(), sign)).rejects.toBe(error);
    });

    it("propagates an error thrown by assembleIssuerSigned", async () => {
      const error = new Error("assembly failed");
      mockAssembleIssuerSigned.mockImplementation(() => {
        throw error;
      });

      await expect(buildMdoc(makeInput(), sign)).rejects.toBe(error);
    });
  });
});
