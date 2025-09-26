import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export const NoGlobalImports: RuleDefinitionWithoutConfig = {
  name: "no-global-imports",
  recommended: true,
  create: function () {
    return new NoGlobalImportsRule(this.name);
  },
};

class NoGlobalImportsRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKind(NonterminalKind.ImportDirective)
    ) {
      const importCursor = cursor.spawn();

      importCursor.goToNextTerminalWithKind(TerminalKind.ImportKeyword);

      const textRange = importCursor.textRange;

      if (!importCursor.goToNextNonterminalWithKind(NonterminalKind.PathImport))
        continue;

      const importPathStringCursor = importCursor.spawn();
      importPathStringCursor.goToNextNonterminalWithKind(
        NonterminalKind.StringLiteral,
      );

      const importPathString = importPathStringCursor.node
        .unparse()
        .trim()
        .slice(1, -1);

      if (
        !importCursor.goToNextNonterminalWithKind(NonterminalKind.ImportAlias)
      ) {
        diagnostics.push({
          sourceId: file.id,
          rule: this.name,
          message: `Global import of '${importPathString}'`,
          line: textRange.start.line,
          column: textRange.start.column,
        });
      }
    }

    return diagnostics;
  }
}
