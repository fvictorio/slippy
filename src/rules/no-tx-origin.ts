import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";

export const NoTxOrigin: RuleDefinitionWithoutConfig = {
  name: "no-tx-origin",
  recommended: true,
  create: function () {
    return new NoTxOriginRule(this.name);
  },
};

class NoTxOriginRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

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

      diagnostics.push({
        sourceId: file.id,
        rule: this.name,
        message: "Avoid using tx.origin",
        line: txTextRange.start.line,
        column: txTextRange.start.column,
      });
    }

    return diagnostics;
  }
}
