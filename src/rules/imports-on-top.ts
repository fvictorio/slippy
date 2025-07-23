import { Rule, LintResult, RuleContext } from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export class ImportsOnTop implements Rule {
  public static ruleName = "imports-on-top";
  public static recommended = true;

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    let hasSeenNonImport = false;
    while (
      cursor.goToNextNonterminalWithKind(NonterminalKind.SourceUnitMember)
    ) {
      if (!cursor.goToFirstChild()) {
        continue;
      }
      if (cursor.node.kind === NonterminalKind.ImportDirective) {
        if (hasSeenNonImport) {
          cursor.goToNextTerminalWithKind(TerminalKind.ImportKeyword);
          // If we have seen a non-import directive before this import,
          results.push({
            rule: ImportsOnTop.ruleName,
            message: "Imports should be at the top of the file.",
            sourceId: file.id,
            line: cursor.textRange.start.line,
            column: cursor.textRange.start.column,
          });
        }
      } else if (cursor.node.kind !== NonterminalKind.PragmaDirective) {
        hasSeenNonImport = true;
      }
    }

    return results;
  }
}
