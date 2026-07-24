import { describe, it, expect } from "vitest";
import { buildValidityInfo } from "./buildValidityInfo.js";

describe("buildValidityInfo", () => {
  const now = new Date("2026-07-24T12:00:00Z");
  const validUntil = new Date("2027-07-24T12:00:00Z");

  it("sets signed to the provided clock time", () => {
    const result = buildValidityInfo({ validUntil }, now);

    expect(result.signed).toEqual(now);
  });

  it("sets validFrom to signed when earliestValidFrom is not provided", () => {
    const result = buildValidityInfo({ validUntil }, now);

    expect(result.validFrom).toEqual(now);
  });

  it("sets validFrom to signed when earliestValidFrom is earlier than signed", () => {
    const earliestValidFrom = new Date("2026-07-24T11:00:00Z");

    const result = buildValidityInfo({ earliestValidFrom, validUntil }, now);

    expect(result.validFrom).toEqual(now);
  });

  it("sets validFrom to signed when earliestValidFrom equals signed", () => {
    const earliestValidFrom = new Date("2026-07-24T12:00:00Z");

    const result = buildValidityInfo({ earliestValidFrom, validUntil }, now);

    expect(result.validFrom).toEqual(now);
  });

  it("sets validFrom to earliestValidFrom when it is after signed", () => {
    const earliestValidFrom = new Date("2026-07-24T14:00:00Z");

    const result = buildValidityInfo({ earliestValidFrom, validUntil }, now);

    expect(result.validFrom).toEqual(earliestValidFrom);
  });

  it("passes through validUntil unchanged", () => {
    const result = buildValidityInfo({ validUntil }, now);

    expect(result.validUntil).toEqual(validUntil);
  });

  it("passes through expectedUpdate when provided", () => {
    const expectedUpdate = new Date("2026-10-24T12:00:00Z");

    const result = buildValidityInfo({ validUntil, expectedUpdate }, now);

    expect(result.expectedUpdate).toEqual(expectedUpdate);
  });

  it("does not include expectedUpdate when not provided", () => {
    const result = buildValidityInfo({ validUntil }, now);

    expect(result).not.toHaveProperty("expectedUpdate");
  });
});
