import { Rule, LintResult, RuleContext } from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export class NoGlobalImports implements Rule {
  public static ruleName = "no-global-imports";
  public static recommended = true;

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

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
        results.push({
          sourceId: file.id,
          rule: NoGlobalImports.ruleName,
          message: `Global import of '${importPathString}'`,
          line: textRange.start.line,
          column: textRange.start.column,
        });
      }
    }

    return results;
  }
}
