import { describe, it, expect } from "vitest";
import {
  validateMdocBuilderInput,
  mdocBuilderInputSchema,
} from "./validateMdocBuilderInput.js";
import { mapZodErrorToValidationErrors } from "./errors.js";
import { DateFormat } from "../types/index.js";
import type { MdocBuilderInput } from "../types/index.js";

const now = new Date("2026-01-01T00:00:00Z");
const validUntil = new Date("2027-01-01T00:00:00Z");

const validInput = (): MdocBuilderInput => ({
  documentType: "org.iso.18013.5.1.mDL",
  nameSpaces: new Map([
    [
      "org.iso.18013.5.1",
      [
        { elementIdentifier: "family_name", elementValue: "Smith" },
        {
          elementIdentifier: "birth_date",
          elementValue: new Date("1990-01-01"),
          dateFormat: DateFormat.FullDate,
        },
      ],
    ],
  ]),
  deviceKey: new Uint8Array([1, 2, 3]),
  credentialValidity: { validUntil },
  statusList: { idx: 1, uri: "https://example.gov.uk/status/1" },
  certificateChain: [new Uint8Array([4, 5, 6])],
});

describe("validateMdocBuilderInput", () => {
  it("returns an empty array for a fully valid input", () => {
    const errors = validateMdocBuilderInput(validInput());
    expect(errors).toEqual([]);
  });

  it("returns errors for an invalid input using the real clock", () => {
    const input = validInput();
    input.documentType = "";
    const errors = validateMdocBuilderInput(input);
    expect(errors.map((e) => e.field)).toContain("documentType");
  });
});

describe("mdocBuilderInputSchema — deterministic clock", () => {
  const validate = (input: MdocBuilderInput) => {
    const result = mdocBuilderInputSchema(now).safeParse(input);
    return result.success ? [] : mapZodErrorToValidationErrors(result.error);
  };

  it("returns no errors for a valid input against the injected clock", () => {
    expect(validate(validInput())).toEqual([]);
  });

  it("rejects a validUntil that is in the past relative to the injected now", () => {
    const input = validInput();
    input.credentialValidity = { validUntil: new Date("2025-06-01T00:00:00Z") };
    const errors = validate(input);
    expect(errors.map((e) => e.field)).toContain(
      "credentialValidity.validUntil",
    );
  });

  it("reports violations across multiple fields without early return", () => {
    const input = validInput();
    input.documentType = "";
    input.deviceKey = new Uint8Array([]);
    input.statusList = { idx: -1, uri: "not a url" };
    input.certificateChain = [];

    const errors = validate(input);
    const fields = errors.map((e) => e.field);

    expect(fields).toContain("documentType");
    expect(fields).toContain("deviceKey");
    expect(fields).toContain("statusList.idx");
    expect(fields).toContain("statusList.uri");
    expect(fields).toContain("certificateChain");
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });

  it("rejects an unknown top-level key", () => {
    const input = {
      ...validInput(),
      unexpected: "value",
    } as unknown as MdocBuilderInput;

    const errors = validate(input);
    expect(errors.map((e) => e.field)).toContain("unexpected");
  });

  it("rejects a misspelled top-level key (nameSpaces -> namespace)", () => {
    const { nameSpaces, ...rest } = validInput();
    const input = {
      ...rest,
      namespace: nameSpaces,
    } as unknown as MdocBuilderInput;

    const errors = validate(input);
    const fields = errors.map((e) => e.field);
    expect(fields).toContain("namespace");
    expect(fields).toContain("nameSpaces");
  });

  it("produces nested field paths in the ticket format", () => {
    const input = validInput();
    input.nameSpaces = new Map([
      ["org.iso.18013.5.1", [{ elementIdentifier: "", elementValue: "Smith" }]],
    ]);

    const errors = validate(input);
    expect(errors.map((e) => e.field)).toContain(
      "nameSpaces.org.iso.18013.5.1[0].elementIdentifier",
    );
  });
});
