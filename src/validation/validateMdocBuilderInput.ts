import { z } from "zod";
import {
  documentTypeSchema,
  deviceKeySchema,
  statusListSchema,
  certificateChainSchema,
} from "./topLevelCredentialFields.js";
import { nameSpacesSchema } from "./nameSpaces.js";
import { credentialValiditySchema } from "./credentialValidity.js";
import { mapZodErrorToValidationErrors } from "./errors.js";
import type { ValidationError } from "./errors.js";

export function mdocBuilderInputSchema(now: Date) {
  return z
    .object({
      documentType: documentTypeSchema,
      nameSpaces: nameSpacesSchema,
      deviceKey: deviceKeySchema,
      credentialValidity: credentialValiditySchema(now),
      statusList: statusListSchema,
      certificateChain: certificateChainSchema,
    })
    .strict();
}

export function validateMdocBuilderInput(input: unknown): ValidationError[] {
  const result = mdocBuilderInputSchema(new Date()).safeParse(input);
  return result.success ? [] : mapZodErrorToValidationErrors(result.error);
}
