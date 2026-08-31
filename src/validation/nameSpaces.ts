import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants.js";
import { dataElementValueSchema } from "./dataElementValue.js";
import { DateFormat } from "../types/index.js";
import type { DataElementValue } from "../types/index.js";

const { namespaceKey, elementIdentifier, minDataElements, maxDataElements } =
  VALIDATION_LIMITS.nameSpaces;

// Date-typing is exhaustive: a value is date-typed if a Date appears anywhere
// within it. This mirrors the encoder (issuerSigned/buildSingleItem), which
// applies dateFormat to every Date it finds, and keeps the check independent of
// element order. Type uniformity is enforced separately by the homogeneity
// rule, so a mixed date/non-date collection is date-typed here and rejected by
// homogeneity — not by the dateFormat rule.
function containsDate(value: unknown): boolean {
  if (value instanceof Date) return true;
  if (value instanceof Map) {
    return [...value.values()].some((v) => v instanceof Date);
  }
  return false;
}

function isDateTyped(elementValue: DataElementValue): boolean {
  if (Array.isArray(elementValue)) {
    return elementValue.some(containsDate);
  }
  return containsDate(elementValue);
}

const namespaceKeySchema = z
  .string()
  .min(namespaceKey.minLength)
  .max(namespaceKey.maxLength);

const dataElementSchema = z
  .object({
    elementIdentifier: z
      .string()
      .min(elementIdentifier.minLength)
      .max(elementIdentifier.maxLength),
    elementValue: dataElementValueSchema,
    dateFormat: z.enum(DateFormat).optional(),
  })
  .superRefine((element, ctx) => {
    if (
      !isDateTyped(element.elementValue) &&
      element.dateFormat !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "dateFormat must not be provided when elementValue is not date-typed",
        path: ["dateFormat"],
      });
    }
  });

export const nameSpacesSchema = z
  .map(
    namespaceKeySchema,
    z.array(dataElementSchema).min(minDataElements).max(maxDataElements),
  )
  .refine((nameSpaces) => nameSpaces.size >= 1, {
    message: "must not be empty",
  });
