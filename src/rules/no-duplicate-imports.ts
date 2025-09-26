import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export const NoDuplicateImports: RuleDefinitionWithoutConfig = {
  name: "no-duplicate-imports",
  recommended: true,
  create: function () {
    return new NoDuplicateImportsRule(this.name);
  },
};

class NoDuplicateImportsRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const importPaths: Set<string> = new Set();

    while (
      cursor.goToNextNonterminalWithKind(NonterminalKind.ImportDirective)
    ) {
      const importPathCursor = cursor.spawn();

      if (
        !importPathCursor.goToNextNonterminalWithKind(
          NonterminalKind.StringLiteral,
        )
      ) {
        continue;
      }

      const importPath = importPathCursor.node.unparse().trim().slice(1, -1);

      const importKeywordCursor = cursor.spawn();
      if (
        !importKeywordCursor.goToNextTerminalWithKind(
          TerminalKind.ImportKeyword,
        )
      ) {
        continue;
      }

      if (importPaths.has(importPath)) {
        diagnostics.push({
          sourceId: file.id,
          rule: this.name,
          message: `Duplicate import of '${importPath}'`,
          line: importKeywordCursor.textRange.start.line,
          column: importKeywordCursor.textRange.start.column,
        });
      } else {
        importPaths.add(importPath);
      }
    }

    return diagnostics;
  }
}
