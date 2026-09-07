import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants.js";
import { isLatin1, LATIN1_MESSAGE } from "./helpers/latin1.js";

const { documentType, deviceKey, statusList, certificateChain } =
  VALIDATION_LIMITS;

function byteLengthSchema(minByteLength: number, maxByteLength: number) {
  return z
    .instanceof(Uint8Array)
    .refine((value) => value.length >= minByteLength, {
      message: "must not be empty",
    })
    .refine((value) => value.length <= maxByteLength, {
      message: `must not exceed ${maxByteLength.toString()} bytes`,
    });
}

export const documentTypeSchema = z
  .string()
  .min(documentType.minLength)
  .max(documentType.maxLength)
  .refine(isLatin1, { message: LATIN1_MESSAGE });

export const deviceKeySchema = byteLengthSchema(
  deviceKey.minByteLength,
  deviceKey.maxByteLength,
);

export const statusListSchema = z
  .object({
    idx: z.number().int().min(statusList.idx.min).max(statusList.idx.max),
    uri: z.url().max(statusList.uri.maxLength),
  })
  .strict();

export const certificateChainSchema = z
  .array(
    byteLengthSchema(
      certificateChain.entry.minByteLength,
      certificateChain.entry.maxByteLength,
    ),
  )
  .min(certificateChain.minLength);
