/**
 * Error thrown by the mdoc builder when construction or signing fails.
 *
 * The error structure will be refined as implementation progresses
 * (e.g., aggregated validation errors may be added later).
 */
export class MdocBuilderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MdocBuilderError";
  }
}
