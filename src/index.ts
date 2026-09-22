export { DateFormat, MdocBuilderError } from "./types";
export type {
  PrimitiveElementValue,
  DataElementValue,
  DataElement,
  NameSpaces,
  CredentialValidity,
  StatusList,
  MdocBuilderInput,
  SigningFunction,
  Mdoc,
} from "./types";
import type { Mdoc, MdocBuilderInput, SigningFunction } from "./types";
import { validateMdocBuilderInput } from "./validation";
import { buildDeviceKeyInfo } from "./deviceKey";
import { buildIssuerSignedItems, assembleIssuerSigned } from "./issuerSigned";
import { buildValidityInfo } from "./validityInfo";
import { buildMso } from "./mso";
import { assembleIssuerAuth } from "./issuerAuth";
import { MdocOutput } from "./mdoc";

/**
 * Builds an mdoc (ISO 18013-5) document from the provided input.
 *
 * Orchestrates the internal components in order: input validation, device key
 * handling, IssuerSignedItem construction, credential validity, MSO
 * construction, signing (issuerAuth assembly), and IssuerSigned assembly.
 *
 * @param input - The mdoc builder input containing document data and metadata.
 * @param sign - A signing function called with the `toBeSigned` bytes.
 * @returns A promise resolving to the built Mdoc document.
 * @throws {MdocBuilderError} If input validation fails, with the aggregated
 * violations in the message. Errors from any other component propagate to the
 * caller unchanged.
 */
export async function buildMdoc(
  input: MdocBuilderInput,
  sign: SigningFunction,
): Promise<Mdoc> {
  validateMdocBuilderInput(input);

  const deviceKeyInfo = buildDeviceKeyInfo(input.deviceKey, [
    ...input.nameSpaces.keys(),
  ]);

  const { issuerSignedItemBytes, valueDigests } = await buildIssuerSignedItems(
    input.nameSpaces,
  );

  const validityInfo = buildValidityInfo(input.credentialValidity);

  const msoBytes = buildMso({
    docType: input.documentType,
    valueDigests,
    deviceKeyInfo,
    validityInfo,
    statusList: input.statusList,
  });

  const issuerAuth = await assembleIssuerAuth(
    msoBytes,
    input.certificateChain,
    sign,
  );

  const bytes = assembleIssuerSigned(issuerSignedItemBytes, issuerAuth);

  return new MdocOutput(bytes);
}
