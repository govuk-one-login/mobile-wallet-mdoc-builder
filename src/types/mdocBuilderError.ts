import type { ValidationError } from "./validationError.js";

/**
 * Options accepted by {@link MdocBuilderError}.
 *
 * Extends the standard {@link ErrorOptions} (e.g. `cause`) with the structured
 * validation violations that caused the failure, when applicable.
 */
export interface MdocBuilderErrorOptions extends ErrorOptions {
  /** The validation violations that caused the build to fail, if any. */
  violations?: ValidationError[];
}

/**
 * Error thrown by the mdoc builder when construction or signing fails.
 *
 * When the failure is caused by input validation, `violations` holds the
 * complete set of {@link ValidationError} entries which callers can inspect.
 */
export class MdocBuilderError extends Error {
  /** The validation violations that caused the failure, if any. */
  readonly violations?: ValidationError[];

  constructor(message: string, options?: MdocBuilderErrorOptions) {
    super(message, options);
    this.name = "MdocBuilderError";
    if (options?.violations !== undefined) {
      this.violations = options.violations;
    }
  }
}
