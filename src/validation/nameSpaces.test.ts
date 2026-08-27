import { describe, it, expect } from "vitest";
import { nameSpacesSchema } from "./nameSpaces.js";
import { VALIDATION_LIMITS } from "./constants.js";
import { DateFormat } from "../types/index.js";
import type { DataElement } from "../types/index.js";

const { maxDataElements, namespaceKey, elementIdentifier } =
  VALIDATION_LIMITS.nameSpaces;

const element = (overrides: Partial<DataElement> = {}): DataElement => ({
  elementIdentifier: "family_name",
  elementValue: "Smith",
  ...overrides,
});

const nameSpaces = (
  entries: [string, DataElement[]][],
): Map<string, DataElement[]> => new Map(entries);

const accepts = (value: unknown) => nameSpacesSchema.safeParse(value).success;

describe("nameSpacesSchema — map structure", () => {
  it("accepts a valid single-namespace map", () => {
    expect(accepts(nameSpaces([["org.iso.18013.5.1", [element()]]]))).toBe(
      true,
    );
  });

  it("rejects an empty map", () => {
    expect(accepts(new Map())).toBe(false);
  });

  it("rejects a non-map value", () => {
    expect(accepts({ "org.iso.18013.5.1": [element()] })).toBe(false);
  });

  it("rejects an empty namespace key", () => {
    expect(accepts(nameSpaces([["", [element()]]]))).toBe(false);
  });

  it("accepts a namespace key at the maximum length", () => {
    const key = "a".repeat(namespaceKey.maxLength);
    expect(accepts(nameSpaces([[key, [element()]]]))).toBe(true);
  });

  it("rejects a namespace key over the maximum length", () => {
    const key = "a".repeat(namespaceKey.maxLength + 1);
    expect(accepts(nameSpaces([[key, [element()]]]))).toBe(false);
  });
});

describe("nameSpacesSchema — data element arrays", () => {
  it("rejects a namespace with no data elements", () => {
    expect(accepts(nameSpaces([["ns", []]]))).toBe(false);
  });

  it("accepts a namespace at the maximum number of data elements", () => {
    const elements = Array.from({ length: maxDataElements }, () => element());
    expect(accepts(nameSpaces([["ns", elements]]))).toBe(true);
  });

  it("rejects a namespace over the maximum number of data elements", () => {
    const elements = Array.from({ length: maxDataElements + 1 }, () =>
      element(),
    );
    expect(accepts(nameSpaces([["ns", elements]]))).toBe(false);
  });

  it("rejects an empty elementIdentifier", () => {
    expect(
      accepts(nameSpaces([["ns", [element({ elementIdentifier: "" })]]])),
    ).toBe(false);
  });

  it("rejects an elementIdentifier over the maximum length", () => {
    const id = "a".repeat(elementIdentifier.maxLength + 1);
    expect(
      accepts(nameSpaces([["ns", [element({ elementIdentifier: id })]]])),
    ).toBe(false);
  });

  it("rejects an invalid elementValue", () => {
    expect(accepts(nameSpaces([["ns", [element({ elementValue: "" })]]]))).toBe(
      false,
    );
  });
});

describe("nameSpacesSchema — dateFormat cross-field rule", () => {
  it("accepts a Date value with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: new Date("2020-01-01"),
                dateFormat: DateFormat.FullDate,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("rejects a Date value without a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          ["ns", [element({ elementValue: new Date("2020-01-01") })]],
        ]),
      ),
    ).toBe(false);
  });

  it("rejects a non-Date value with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: "Smith",
                dateFormat: DateFormat.DateTime,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(false);
  });

  it("accepts a non-Date value without a dateFormat", () => {
    expect(
      accepts(nameSpaces([["ns", [element({ elementValue: "Smith" })]]])),
    ).toBe(true);
  });
});

describe("nameSpacesSchema — collects multiple violations", () => {
  it("reports every violation across namespaces without early return", () => {
    const value = nameSpaces([
      ["ns1", [element({ elementIdentifier: "" })]],
      ["ns2", [element({ elementValue: new Date("2020-01-01") })]],
    ]);

    const result = nameSpacesSchema.safeParse(value);
    if (result.success) throw new Error("expected failure");

    expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
  });
});
