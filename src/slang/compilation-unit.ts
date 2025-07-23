import {
  CompilationBuilder,
  CompilationUnit,
} from "@nomicfoundation/slang/compilation";
import { AssertionError } from "../errors.js";
import { inferSolidityVersion } from "./solidity-version.js";

export async function compilationUnitFromContent({
  content,
  filePath,
}: {
  content: string;
  filePath: string;
}): Promise<CompilationUnit> {
  async function readFile(fileId: string) {
    if (fileId === filePath) {
      return content;
    }

    throw new AssertionError(
      `File added to compilation unit must be the same as the one passed to compilationUnitFromContent`,
    );
  }

  const languageVersion = inferSolidityVersion(filePath, content);

  const builder = CompilationBuilder.create({
    languageVersion,
    readFile,
    resolveImport: async () => undefined,
  });

  await builder.addFile(filePath);

  return builder.build();
}
