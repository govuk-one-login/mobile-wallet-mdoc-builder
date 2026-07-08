import type { CredentialValidity } from "./credential-validity.js";
import type { NameSpaces } from "./name-spaces.js";
import type { StatusList } from "./status-list.js";

/**
 * The top-level input for building a mdoc document.
 */
export interface MdocBuilderInput {
  /** The document type (e.g. "org.iso.18013.5.1.mDL"). */
  documentType: string;

  /** The namespaces and their data elements to include in the mdoc. */
  nameSpaces: NameSpaces;

  /** The SPKI-encoded holder public key. */
  deviceKey: Uint8Array;

  /** The validity period of the credential. */
  credentialValidity: CredentialValidity;

  /** A reference to a status list for revocation checking. */
  statusList: StatusList;

  /**
   * Array of DER-encoded certificates. The library will use
   * certificateChain[0] as the document signing certificate.
   */
  certificateChain: Uint8Array[];
}
