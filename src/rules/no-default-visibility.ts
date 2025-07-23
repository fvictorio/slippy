import { StateVariableDefinition } from "@nomicfoundation/slang/ast";
import { hasDefaultVisibility } from "../slang/state-variables.js";
import { Rule, LintResult, RuleContext } from "./types.js";
import {
  assertNonterminalNode,
  NonterminalKind,
  TerminalKindExtensions,
} from "@nomicfoundation/slang/cst";

export class NoDefaultVisibility implements Rule {
  public static ruleName = "no-default-visibility";
  public static recommended = true;

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKind(
        NonterminalKind.StateVariableDefinition,
      )
    ) {
      assertNonterminalNode(cursor.node);
      const stateVariableDefinition = new StateVariableDefinition(cursor.node);
      const defaultVisibility = hasDefaultVisibility(stateVariableDefinition);

      const name = stateVariableDefinition.name.unparse();

      if (defaultVisibility) {
        const firstTerminalCursor = cursor.spawn();
        while (
          firstTerminalCursor.goToNextTerminal() &&
          firstTerminalCursor.node.isTerminalNode() &&
          TerminalKindExtensions.isTrivia(firstTerminalCursor.node.kind)
        ) {
          // ignore trivia
        }
        results.push({
          rule: NoDefaultVisibility.ruleName,
          sourceId: file.id,
          line: firstTerminalCursor.textRange.start.line,
          column: firstTerminalCursor.textRange.start.column,
          message: `State variable '${name}' has default visibility`,
        });
      }
    }

    return results;
  }
}
