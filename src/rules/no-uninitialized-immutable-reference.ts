import { StateVariableDefinition } from "@nomicfoundation/slang/ast";
import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";
import { isImmutable } from "../slang/state-variables.js";

export const NoUninitializedImmutableReference: RuleDefinitionWithoutConfig = {
  name: "no-uninitialized-immutable-references",
  recommended: true,
  create: function () {
    return new NoUninitializedImmutableReferenceRule(this.name);
  },
};

class NoUninitializedImmutableReferenceRule implements RuleWithoutConfig {
  constructor(public name: string) {}

  public run({ file, unit }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

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
          diagnostics.push({
            rule: this.name,
            sourceId: file.id,
            message: `Immutable variable '${valueCursor.node.unparse()}' cannot be referenced before it is initialized`,
            line: valueCursor.textRange.start.line,
            column: valueCursor.textRange.start.column,
          });
        }
      }
    }

    return diagnostics;
  }
}
