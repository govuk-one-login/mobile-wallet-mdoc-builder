import { describe, it, expect } from "vitest";
import { nameSpacesSchema } from "./nameSpaces.js";
import { mapZodErrorToValidationErrors } from "./errors.js";
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
    /*
      {
        "org.iso.18013.5.1": [{
          elementIdentifier: "family_name",
          elementValue: "Smith",
        }]
      }
     */
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

  it("accepts a Date value without a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          ["ns", [element({ elementValue: new Date("2020-01-01") })]],
        ]),
      ),
    ).toBe(true);
  });

  it("rejects a non-Date value with a dateFormat", () => {
    const result = nameSpacesSchema.safeParse(
      nameSpaces([
        [
          "ns",
          [element({ elementValue: "Smith", dateFormat: DateFormat.DateTime })],
        ],
      ]),
    );
    if (result.success) throw new Error("expected failure");

    const errors = mapZodErrorToValidationErrors(result.error);
    expect(errors).toContainEqual({
      field: "ns[0].dateFormat",
      message:
        "dateFormat must not be provided when elementValue is not date-typed",
    });
  });

  it("accepts a non-Date value without a dateFormat", () => {
    expect(
      accepts(nameSpaces([["ns", [element({ elementValue: "Smith" })]]])),
    ).toBe(true);
  });

  it("accepts an array of Dates with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [new Date("2020-01-01"), new Date("2021-01-01")],
                dateFormat: DateFormat.FullDate,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("accepts an array of Dates without a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [new Date("2020-01-01"), new Date("2021-01-01")],
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("rejects an array of non-Date values with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [1, 2, 3],
                dateFormat: DateFormat.DateTime,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(false);
  });

  it("accepts an array of non-Date values without a dateFormat", () => {
    expect(
      accepts(nameSpaces([["ns", [element({ elementValue: [1, 2, 3] })]]])),
    ).toBe(true);
  });

  it("accepts a Map of Dates with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: new Map([
                  ["issued", new Date("2020-01-01")],
                  ["expires", new Date("2021-01-01")],
                ]),
                dateFormat: DateFormat.DateTime,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("accepts a Map of Dates without a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: new Map([
                  ["issued", new Date("2020-01-01")],
                  ["expires", new Date("2021-01-01")],
                ]),
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("rejects a Map of non-Date values with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: new Map([["count", 1]]),
                dateFormat: DateFormat.DateTime,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(false);
  });

  it("accepts an array of Maps of Dates with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [new Map([["issued", new Date("2020-01-01")]])],
                dateFormat: DateFormat.FullDate,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("accepts an array of Maps of Dates without a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [new Map([["issued", new Date("2020-01-01")]])],
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("rejects an array of Maps of non-Date values with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [new Map([["count", 1]])],
                dateFormat: DateFormat.DateTime,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(false);
  });

  it("rejects an array of maps with a dateFormat when only some maps are date-typed (Date-map first)", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [
                  new Map([["issued", new Date("2020-01-01")]]),
                  new Map([["count", 1]]),
                ],
                dateFormat: DateFormat.DateTime,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(false);
  });

  it("rejects an array of maps with a dateFormat when only some maps are date-typed (Date-map last)", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [
                  new Map([["count", 1]]),
                  new Map([["issued", new Date("2020-01-01")]]),
                ],
                dateFormat: DateFormat.DateTime,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(false);
  });

  it("accepts an array of partially date-typed maps without a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [
                  new Map([["count", 1]]),
                  new Map([["issued", new Date("2020-01-01")]]),
                ],
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  it("accepts an array where every map is date-typed with a dateFormat", () => {
    expect(
      accepts(
        nameSpaces([
          [
            "ns",
            [
              element({
                elementValue: [
                  new Map([["issued", new Date("2020-01-01")]]),
                  new Map([["expires", new Date("2021-01-01")]]),
                ],
                dateFormat: DateFormat.FullDate,
              }),
            ],
          ],
        ]),
      ),
    ).toBe(true);
  });

  // A mixed date/non-date map is a single date-typed value (it holds a Date),
  // so it fails on homogeneity only — not the dateFormat rule — regardless of
  // entry order.
  describe("mixed date/non-date maps fail on homogeneity, not dateFormat", () => {
    const rejectsWithHomogeneityMessage = (
      elementValue: DataElement["elementValue"],
    ) => {
      const result = nameSpacesSchema.safeParse(
        nameSpaces([
          ["ns", [element({ elementValue, dateFormat: DateFormat.FullDate })]],
        ]),
      );
      if (result.success) throw new Error("expected failure");

      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("all values must be the same primitive type");
      expect(messages).not.toContain(
        "dateFormat must not be provided when elementValue is not date-typed",
      );
    };

    it("reports homogeneity for a Date-first mixed map", () => {
      rejectsWithHomogeneityMessage(
        new Map<string, Date | number>([
          ["issued", new Date("2020-01-01")],
          ["count", 1],
        ]),
      );
    });

    it("reports homogeneity for a Date-last mixed map", () => {
      rejectsWithHomogeneityMessage(
        new Map<string, Date | number>([
          ["count", 1],
          ["issued", new Date("2020-01-01")],
        ]),
      );
    });
  });

  // A mixed date/non-date array is not date-typed under the strict all-elements
  // rule, so it is rejected. Homogeneity is the primary violation; dateFormat
  // may also fire since the array is not date-typed. Order-independent.
  describe("mixed date/non-date arrays are rejected on homogeneity", () => {
    const rejectsWithHomogeneityMessage = (
      elementValue: DataElement["elementValue"],
    ) => {
      const result = nameSpacesSchema.safeParse(
        nameSpaces([
          ["ns", [element({ elementValue, dateFormat: DateFormat.FullDate })]],
        ]),
      );
      if (result.success) throw new Error("expected failure");

      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("all values must be the same primitive type");
    };

    it("reports homogeneity for a Date-first mixed array", () => {
      rejectsWithHomogeneityMessage([new Date("2020-01-01"), 1]);
    });

    it("reports homogeneity for a Date-last mixed array", () => {
      rejectsWithHomogeneityMessage([1, new Date("2020-01-01")]);
    });
  });
});

describe("nameSpacesSchema — collects multiple violations", () => {
  it("reports every violation across namespaces without early return", () => {
    const value = nameSpaces([
      ["ns1", [element({ elementIdentifier: "" })]],
      [
        "ns2",
        [element({ elementValue: "Smith", dateFormat: DateFormat.DateTime })],
      ],
    ]);

    const result = nameSpacesSchema.safeParse(value);
    if (result.success) throw new Error("expected failure");

    expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
  });
});
