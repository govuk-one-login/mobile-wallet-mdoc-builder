import type { ZodError } from "zod";

export interface ValidationError {
  field: string;
  message: string;
}

export function formatFieldPath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment.toString()}]`;
    }
    const key = String(segment);
    return acc === "" ? key : `${acc}.${key}`;
  }, "");
}

export function mapZodErrorToValidationErrors(
  error: ZodError,
): ValidationError[] {
  return error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => ({
        field: formatFieldPath([...issue.path, key]),
        message: issue.message,
      }));
    }

    return {
      field: formatFieldPath(issue.path),
      message: issue.message,
    };
  });
}
