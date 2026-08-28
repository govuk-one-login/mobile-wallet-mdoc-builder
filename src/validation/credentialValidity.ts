import { z } from "zod";

export function credentialValiditySchema(now: Date) {
  return z
    .object({
      earliestValidFrom: z.date().optional(),
      validUntil: z.date(),
      expectedUpdate: z.date().optional(),
    })
    .superRefine((validity, ctx) => {
      if (validity.validUntil.getTime() <= now.getTime()) {
        ctx.addIssue({
          code: "custom",
          message: "must be after the current time",
          path: ["validUntil"],
        });
      }

      if (
        validity.earliestValidFrom !== undefined &&
        validity.earliestValidFrom.getTime() >= validity.validUntil.getTime()
      ) {
        ctx.addIssue({
          code: "custom",
          message: "must be before validUntil",
          path: ["earliestValidFrom"],
        });
      }

      if (
        validity.expectedUpdate !== undefined &&
        validity.expectedUpdate.getTime() > validity.validUntil.getTime()
      ) {
        ctx.addIssue({
          code: "custom",
          message: "must be before or equal to validUntil",
          path: ["expectedUpdate"],
        });
      }
    });
}
