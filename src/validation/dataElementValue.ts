import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants.js";
import {
  stringValueSchema,
  numberValueSchema,
  booleanValueSchema,
  dateValueSchema,
  uint8ArrayValueSchema,
} from "./primitives.js";

const { minLength, maxLength } = VALIDATION_LIMITS.collections;

const primitiveValueSchema = z.union([
  stringValueSchema,
  numberValueSchema,
  booleanValueSchema,
  dateValueSchema,
  uint8ArrayValueSchema,
]);

type PrimitiveTypeTag = "string" | "number" | "boolean" | "date" | "uint8Array";

function primitiveTypeTag(value: unknown): PrimitiveTypeTag {
  if (value instanceof Uint8Array) return "uint8Array";
  if (value instanceof Date) return "date";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  return "boolean";
}

function isHomogeneous(values: Iterable<unknown>): boolean {
  let tag: PrimitiveTypeTag | undefined;
  for (const value of values) {
    const current = primitiveTypeTag(value);
    tag ??= current;
    if (current !== tag) return false;
  }
  return true;
}

const HOMOGENEITY_MESSAGE = "all values must be the same primitive type";

const primitiveArraySchema = z
  .array(primitiveValueSchema)
  .min(minLength)
  .max(maxLength)
  .refine(isHomogeneous, { message: HOMOGENEITY_MESSAGE });

const primitiveMapSchema = z
  .map(z.string(), primitiveValueSchema)
  .refine((map) => map.size >= minLength, { message: "must not be empty" })
  .refine((map) => map.size <= maxLength, {
    message: `must not exceed ${maxLength.toString()} entries`,
  })
  .refine((map) => isHomogeneous(map.values()), {
    message: HOMOGENEITY_MESSAGE,
  });

const primitiveMapArraySchema = z
  .array(z.map(z.string(), primitiveValueSchema))
  .min(minLength)
  .max(maxLength)
  .refine((maps) => maps.every((map) => map.size >= minLength), {
    message: "each map must not be empty",
  })
  .refine((maps) => maps.every((map) => map.size <= maxLength), {
    message: `each map must not exceed ${maxLength.toString()} entries`,
  })
  .refine((maps) => maps.every((map) => isHomogeneous(map.values())), {
    message: HOMOGENEITY_MESSAGE,
  });

export const dataElementValueSchema = z.union([
  primitiveMapArraySchema,
  primitiveMapSchema,
  primitiveArraySchema,
  primitiveValueSchema,
]);
