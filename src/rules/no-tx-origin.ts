import { Rule, LintResult, RuleContext } from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export class NoTxOrigin implements Rule {
  public static ruleName = "no-tx-origin";
  public static recommended = true;

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKind(NonterminalKind.MemberAccessExpression)
    ) {
      const memberAccess = cursor.spawn();

      if (!memberAccess.goToFirstChild()) continue;
      if (!memberAccess.node.isNonterminalNode()) continue;
      if (memberAccess.node.kind !== NonterminalKind.Expression) continue;

      if (memberAccess.goToNextTerminalWithKind(TerminalKind.Identifier)) {
        if (memberAccess.node.unparse() !== "tx") continue;
      }

      const txTextRange = memberAccess.textRange;

      if (memberAccess.goToNextTerminalWithKind(TerminalKind.Identifier)) {
        if (memberAccess.node.unparse() !== "origin") continue;
      }

      results.push({
        sourceId: file.id,
        rule: NoTxOrigin.ruleName,
        message: "Avoid using tx.origin",
        line: txTextRange.start.line,
        column: txTextRange.start.column,
      });
    }

    return results;
  }
}
