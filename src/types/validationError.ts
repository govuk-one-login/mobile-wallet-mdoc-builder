/**
 * A single input validation violation.
 *
 * Reported by the builder when {@link MdocBuilderInput} fails validation. The
 * complete set of violations for a failed build is carried on
 * `MdocBuilderError.violations`.
 */
export interface ValidationError {
  /** The path to the invalid field (e.g. `"statusList.idx"`, `"nameSpaces"`). */
  field: string;

  /** A human-readable description of the violation. */
  message: string;
}
