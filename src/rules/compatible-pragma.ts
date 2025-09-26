import { VersionPragma } from "@nomicfoundation/slang/ast";
import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  NonterminalKind,
} from "@nomicfoundation/slang/cst";
import semver from "semver";
import { Parser } from "@nomicfoundation/slang/parser";
import { AssertionError } from "../errors.js";

const name = "compatible-pragma";

export const CompatiblePragma: RuleDefinitionWithoutConfig = {
  name,
  recommended: true,
  create: function () {
    return new CompatiblePragmaRule(this.name);
  },
};

class CompatiblePragmaRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ content, file }: RuleContext): Diagnostic[] {
    const versionPragmas: string[] = [];

    const cursor = file.createTreeCursor();

    while (cursor.goToNextNonterminalWithKind(NonterminalKind.VersionPragma)) {
      assertNonterminalNode(cursor.node);

      const versionPragma = new VersionPragma(cursor.node);

      versionPragmas.push(versionPragma.sets.cst.unparse());
    }

    if (versionPragmas.length === 0) {
      return [];
    }

    const minVersion = semver.minVersion(versionPragmas.join(" "));

    if (minVersion === null) {
      throw new AssertionError("Incompatible pragma versions");
    }

    const parser = Parser.create(minVersion.version);

    const cst = parser.parseFileContents(content);

    const errors = cst.errors();
    if (errors.length > 0) {
      const error = errors[0];

      return [
        {
          rule: this.name,
          sourceId: file.id,
          message: `The minimum solidity version compatible with this file is ${minVersion.version} but the file has a syntax error for that version`,
          line: error.textRange.start.line,
          column: error.textRange.start.column,
        },
      ];
    }

    return [];
  }
}
