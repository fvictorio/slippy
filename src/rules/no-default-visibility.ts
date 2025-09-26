import { StateVariableDefinition } from "@nomicfoundation/slang/ast";
import { hasDefaultVisibility } from "../slang/state-variables.js";
import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  NonterminalKind,
  TerminalKindExtensions,
} from "@nomicfoundation/slang/cst";

export const NoDefaultVisibility: RuleDefinitionWithoutConfig = {
  name: "no-default-visibility",
  recommended: true,
  create: function () {
    return new NoDefaultVisibilityRule(this.name);
  },
};

class NoDefaultVisibilityRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

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
        diagnostics.push({
          rule: this.name,
          sourceId: file.id,
          line: firstTerminalCursor.textRange.start.line,
          column: firstTerminalCursor.textRange.start.column,
          message: `State variable '${name}' has default visibility`,
        });
      }
    }

    return diagnostics;
  }
}
