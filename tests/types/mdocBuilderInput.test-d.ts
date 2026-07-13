import { describe, expectTypeOf, it } from "vitest";
import type {
  MdocBuilderInput,
  NameSpaces,
  CredentialValidity,
  StatusList,
} from "../../src";

describe("MdocBuilderInput", () => {
  it("accepts a valid full input", () => {
    expectTypeOf<{
      documentType: string;
      nameSpaces: NameSpaces;
      deviceKey: Uint8Array;
      credentialValidity: CredentialValidity;
      statusList: StatusList;
      certificateChain: Uint8Array[];
    }>().toExtend<MdocBuilderInput>();
  });

  it("does not accept missing documentType", () => {
    expectTypeOf<{
      nameSpaces: NameSpaces;
      deviceKey: Uint8Array;
      credentialValidity: CredentialValidity;
      statusList: StatusList;
      certificateChain: Uint8Array[];
    }>().not.toExtend<MdocBuilderInput>();
  });

  it("does not accept missing nameSpaces", () => {
    expectTypeOf<{
      documentType: string;
      deviceKey: Uint8Array;
      credentialValidity: CredentialValidity;
      statusList: StatusList;
      certificateChain: Uint8Array[];
    }>().not.toExtend<MdocBuilderInput>();
  });

  it("does not accept missing deviceKey", () => {
    expectTypeOf<{
      documentType: string;
      nameSpaces: NameSpaces;
      credentialValidity: CredentialValidity;
      statusList: StatusList;
      certificateChain: Uint8Array[];
    }>().not.toExtend<MdocBuilderInput>();
  });

  it("does not accept missing credentialValidity", () => {
    expectTypeOf<{
      documentType: string;
      nameSpaces: NameSpaces;
      deviceKey: Uint8Array;
      statusList: StatusList;
      certificateChain: Uint8Array[];
    }>().not.toExtend<MdocBuilderInput>();
  });

  it("does not accept missing statusList", () => {
    expectTypeOf<{
      documentType: string;
      nameSpaces: NameSpaces;
      deviceKey: Uint8Array;
      credentialValidity: CredentialValidity;
      certificateChain: Uint8Array[];
    }>().not.toExtend<MdocBuilderInput>();
  });

  it("does not accept missing certificateChain", () => {
    expectTypeOf<{
      documentType: string;
      nameSpaces: NameSpaces;
      deviceKey: Uint8Array;
      credentialValidity: CredentialValidity;
      statusList: StatusList;
    }>().not.toExtend<MdocBuilderInput>();
  });

  it("does not accept wrong type for deviceKey", () => {
    expectTypeOf<{
      documentType: string;
      nameSpaces: NameSpaces;
      deviceKey: string;
      credentialValidity: CredentialValidity;
      statusList: StatusList;
      certificateChain: Uint8Array[];
    }>().not.toExtend<MdocBuilderInput>();
  });

  it("does not accept wrong type for certificateChain", () => {
    expectTypeOf<{
      documentType: string;
      nameSpaces: NameSpaces;
      deviceKey: Uint8Array;
      credentialValidity: CredentialValidity;
      statusList: StatusList;
      certificateChain: string[];
    }>().not.toExtend<MdocBuilderInput>();
  });
});
