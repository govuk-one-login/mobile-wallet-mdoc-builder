import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants.js";
import { dataElementValueSchema } from "./dataElementValue.js";
import { DateFormat } from "../types/index.js";
import type { DataElementValue } from "../types/index.js";

const { namespaceKey, elementIdentifier, minDataElements, maxDataElements } =
  VALIDATION_LIMITS.nameSpaces;

function containsDate(value: unknown): boolean {
  if (value instanceof Date) return true;
  if (value instanceof Map) {
    return value.values().next().value instanceof Date;
  }
  return false;
}

function isDateTyped(elementValue: DataElementValue): boolean {
  if (Array.isArray(elementValue)) {
    return containsDate(elementValue[0]);
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
