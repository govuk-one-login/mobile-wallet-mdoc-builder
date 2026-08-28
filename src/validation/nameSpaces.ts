import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants.js";
import { dataElementValueSchema } from "./dataElementValue.js";
import { DateFormat } from "../types/index.js";

const { namespaceKey, elementIdentifier, minDataElements, maxDataElements } =
  VALIDATION_LIMITS.nameSpaces;

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
    const isDate = element.elementValue instanceof Date;
    if (!isDate && element.dateFormat !== undefined) {
      ctx.addIssue({
        code: "custom",
        message:
          "dateFormat must not be provided when elementValue is not a Date",
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
