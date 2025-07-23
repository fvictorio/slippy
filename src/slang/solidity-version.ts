import { LanguageFacts } from "@nomicfoundation/slang/utils";
import { SlippyCantInferSolidityVersionError } from "../errors.js";

export function inferSolidityVersion(
  sourceId: string,
  content: string,
): string {
  const versions = LanguageFacts.inferLanguageVersions(content);
  if (versions.length === 0) {
    // throw custom slippy error
    throw new SlippyCantInferSolidityVersionError(sourceId);
  }

  return versions[versions.length - 1];
}
