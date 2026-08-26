import type { DeviceKeyInfo } from "../deviceKey";
import type { ValidityInfo } from "../validityInfo";
import type { StatusList } from "../types";
import { embeddedCbor, encode, tdate } from "../cbor";

export interface MsoInput {
  docType: string;
  valueDigests: Map<string, Map<number, Uint8Array>>;
  deviceKeyInfo: DeviceKeyInfo;
  validityInfo: ValidityInfo;
  statusList: StatusList;
}

export function buildMso(input: MsoInput): Uint8Array {
  const validityInfoMap = new Map<string, unknown>();
  validityInfoMap.set("signed", tdate(input.validityInfo.signed));
  validityInfoMap.set("validFrom", tdate(input.validityInfo.validFrom));
  validityInfoMap.set("validUntil", tdate(input.validityInfo.validUntil));
  if (input.validityInfo.expectedUpdate !== undefined) {
    validityInfoMap.set(
      "expectedUpdate",
      tdate(input.validityInfo.expectedUpdate),
    );
  }

  const statusListMap = new Map<string, unknown>();
  statusListMap.set("idx", input.statusList.idx);
  statusListMap.set("uri", input.statusList.uri);

  const statusMap = new Map<string, unknown>();
  statusMap.set("status_list", statusListMap);

  const mso = new Map<string, unknown>();
  mso.set("version", "1.0");
  mso.set("digestAlgorithm", "SHA-256");
  mso.set("valueDigests", input.valueDigests);
  mso.set("deviceKeyInfo", input.deviceKeyInfo);
  mso.set("validityInfo", validityInfoMap);
  mso.set("status", statusMap);
  mso.set("docType", input.docType);

  const encodedMso = encode(mso);
  return encode(embeddedCbor(encodedMso));
}
