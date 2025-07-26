import { StateVariableDefinition } from "@nomicfoundation/slang/ast";
import {
  LintResult,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  NonterminalKind,
} from "@nomicfoundation/slang/cst";
import {
  isConstant,
  isImmutable,
  isPrivate,
} from "../slang/state-variables.js";

export const PrivateVars: RuleDefinitionWithoutConfig = {
  name: "private-vars",
  recommended: false,
  create: function () {
    return new PrivateVarsRule(this.name);
  },
};

class PrivateVarsRule implements RuleWithoutConfig {
  constructor(public name: string) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKind(
        NonterminalKind.StateVariableDefinition,
      )
    ) {
      assertNonterminalNode(cursor.node);
      const stateVariable = new StateVariableDefinition(cursor.node);

      while (cursor.node.id !== stateVariable.name.id && cursor.goToNext()) {
        // Move to the next node until we find the name of the state variable
      }

      if (
        !isConstant(stateVariable) &&
        !isImmutable(stateVariable) &&
        !isPrivate(stateVariable)
      ) {
        results.push({
          rule: this.name,
          sourceId: file.id,
          message: `State variable '${stateVariable.name.unparse()}' should be private`,
          line: cursor.textRange.start.line,
          column: cursor.textRange.start.column,
        });
      }
    }

    return results;
  }
}
