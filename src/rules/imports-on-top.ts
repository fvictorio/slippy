import {
  LintResult,
  RuleContext,
  RuleDefinition,
  RuleWithoutConfig,
} from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export const ImportsOnTop: RuleDefinition<null> = {
  name: "imports-on-top",
  recommended: true,
  create: function () {
    return new ImportsOnTopRule(this.name);
  },
};

class ImportsOnTopRule implements RuleWithoutConfig {
  public recommended = true;

  constructor(public name: string) {}

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
            rule: this.name,
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
