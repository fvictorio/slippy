import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "../../../src/rules/types.js";
import { Cursor, NonterminalKind } from "@nomicfoundation/slang/cst";

export const StubSwapFirstTwoStateVars: RuleDefinitionWithoutConfig = {
  name: "stub-swap-first-two-state-vars",
  recommended: false,
  create: function () {
    return new StubSwapFirstTwoStateVarsRule(this.name);
  },
};

class StubSwapFirstTwoStateVarsRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    let stateVar1Cursor: Cursor | undefined;
    let stateVar2Cursor: Cursor | undefined;

    while (
      cursor.goToNextNonterminalWithKind(
        NonterminalKind.StateVariableDefinition,
      )
    ) {
      if (stateVar1Cursor === undefined) {
        stateVar1Cursor = cursor.spawn();
      } else if (stateVar2Cursor === undefined) {
        stateVar2Cursor = cursor.spawn();
        break;
      }
    }

    if (stateVar1Cursor !== undefined && stateVar2Cursor !== undefined) {
      if (!stateVar1Cursor.node.unparse().includes("foo")) {
        return [];
      }

      diagnostics.push({
        rule: this.name,
        sourceId: file.id,
        message: `Swap the first two state variables`,
        line: stateVar1Cursor.textRange.start.line,
        column: stateVar1Cursor.textRange.start.column,
        fix: [
          {
            range: [
              stateVar1Cursor.textRange.start.utf16,
              stateVar1Cursor.textRange.end.utf16,
            ],
            replacement: stateVar2Cursor.node.unparse(),
          },
          {
            range: [
              stateVar2Cursor.textRange.start.utf16,
              stateVar2Cursor.textRange.end.utf16,
            ],
            replacement: stateVar1Cursor.node.unparse(),
          },
        ],
      });
    }

    return diagnostics;
  }
}
