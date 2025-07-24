import { StateVariableDefinition } from "@nomicfoundation/slang/ast";
import { Rule, LintResult, RuleContext } from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";
import { isImmutable } from "../slang/state-variables.js";

export class NoUninitializedImmutableReference implements Rule {
  public static ruleName = "no-uninitialized-immutable-references";
  public static recommended = true;

  public run({ file, unit }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKind(
        NonterminalKind.StateVariableDefinition,
      )
    ) {
      const definedStateVariableCursor = cursor.spawn();

      if (
        !cursor.goToNextNonterminalWithKind(
          NonterminalKind.StateVariableDefinitionValue,
        )
      )
        continue;

      const valueCursor = cursor.spawn();
      while (valueCursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
        const reference = unit.bindingGraph.referenceAt(valueCursor);

        if (reference === undefined) continue;

        const definitions = reference.definitions();

        if (definitions.length !== 1) continue;

        const definition = definitions[0];

        const definiens = definition.definiensLocation;

        if (!definiens.isUserFileLocation()) continue;

        if (
          definiens.cursor.node.kind !== NonterminalKind.StateVariableDefinition
        )
          continue;

        const referencedStateVariable = new StateVariableDefinition(
          definiens.cursor.node,
        );

        if (!isImmutable(referencedStateVariable)) continue;

        const definedOffset = definedStateVariableCursor.textOffset.utf8;
        const referencedOffset = definiens.cursor.textOffset.utf8;

        if (referencedOffset > definedOffset) {
          results.push({
            rule: NoUninitializedImmutableReference.ruleName,
            sourceId: file.id,
            message: `Immutable variable '${valueCursor.node.unparse()}' cannot be referenced before it is initialized`,
            line: valueCursor.textRange.start.line,
            column: valueCursor.textRange.start.column,
          });
        }
      }
    }

    return results;
  }
}
