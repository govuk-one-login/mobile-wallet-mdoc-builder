import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants.js";
import { dataElementValueSchema } from "./dataElementValue.js";
import { DateFormat } from "../types/index.js";

const { namespaceKey, elementIdentifier, minDataElements, maxDataElements } =
  VALIDATION_LIMITS.nameSpaces;

// A value is date-typed if it holds a Date. Homogeneity guarantees collections
// are a single primitive type, so a Date anywhere means the whole value is
// date-typed.
function isDateTyped(value: unknown): boolean {
  if (value instanceof Date) return true;
  if (value instanceof Map) {
    return [...value.values()].some((v) => v instanceof Date);
  }
  if (Array.isArray(value)) {
    return value.some(isDateTyped);
  }
  return false;
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
