import { Rule, LintResult, RuleContext } from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export class NoDuplicateImports implements Rule {
  public static ruleName = "no-duplicate-imports";
  public static recommended = true;

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

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
        results.push({
          sourceId: file.id,
          rule: NoDuplicateImports.ruleName,
          message: `Duplicate import of '${importPath}'`,
          line: importKeywordCursor.textRange.start.line,
          column: importKeywordCursor.textRange.start.column,
        });
      } else {
        importPaths.add(importPath);
      }
    }

    return results;
  }
}
