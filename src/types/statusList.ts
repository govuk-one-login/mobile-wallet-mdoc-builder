/**
 * A reference to a status list entry for credential revocation checking.
 */
export interface StatusList {
  /** The index of this credential's entry in the status list. */
  idx: number;

  /** The URI of the status list. */
  uri: string;
}
