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
import { MdocBuilderError } from "./types";

/**
 * Builds an mdoc (ISO 18013-5) document from the provided input.
 *
 * @param input - The mdoc builder input containing document data and metadata.
 * @param sign - A signing function that will be called with the data to sign.
 * @returns A promise resolving to the built Mdoc document.
 * @throws {MdocBuilderError} Always throws until implementation is complete.
 */
export function buildMdoc(
  input: MdocBuilderInput,
  sign: SigningFunction,
): Promise<Mdoc> {
  console.log("buildMdoc not implemented", { input, sign });
  return Promise.reject(new MdocBuilderError("not implemented"));
}
