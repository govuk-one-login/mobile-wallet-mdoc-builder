import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants.js";

const { string, number, uint8Array } = VALIDATION_LIMITS.elementValue;

export const stringValueSchema = z
  .string()
  .min(string.minLength)
  .max(string.maxLength);

export const numberValueSchema = z.number().min(number.min).max(number.max);

export const booleanValueSchema = z.boolean();

export const dateValueSchema = z.date();

export const uint8ArrayValueSchema = z
  .instanceof(Uint8Array)
  .refine((value) => value.length >= uint8Array.minByteLength, {
    message: "must not be empty",
  })
  .refine((value) => value.length <= uint8Array.maxByteLength, {
    message: `must not exceed ${uint8Array.maxByteLength.toString()} bytes`,
  });
