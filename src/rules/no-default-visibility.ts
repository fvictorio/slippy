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
  Cursor,
  NonterminalKind,
  TerminalKind,
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

  public run({ content, file }: RuleContext): Diagnostic[] {
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

      if (defaultVisibility) {
        const nameCursor = getNameCursor(
          cursor.spawn(),
          stateVariableDefinition,
        );
        const name = nameCursor.node.unparse();

        const firstTerminalCursor = cursor.spawn();
        while (
          firstTerminalCursor.goToNextTerminal() &&
          firstTerminalCursor.node.isTerminalNode() &&
          TerminalKindExtensions.isTrivia(firstTerminalCursor.node.kind)
        ) {
          // ignore trivia
        }

        const insertionPoint = nameCursor.textRange.start.utf16;
        const hasNonWhitespaceBefore =
          content[insertionPoint - 1]?.match(/\S/) !== null;

        diagnostics.push({
          rule: this.name,
          sourceId: file.id,
          line: firstTerminalCursor.textRange.start.line,
          column: firstTerminalCursor.textRange.start.column,
          message: `State variable '${name}' has default visibility`,
          fix: [
            {
              range: [insertionPoint, insertionPoint],
              replacement: hasNonWhitespaceBefore ? " public " : "public ",
            },
          ],
        });
      }
    }

    return diagnostics;
  }
}

function getNameCursor(
  cursor: Cursor,
  stateVariableDefinition: StateVariableDefinition,
): Cursor {
  const nameId = stateVariableDefinition.name.id;

  while (
    cursor.node.id !== nameId &&
    cursor.goToNextTerminalWithKind(TerminalKind.Identifier)
  ) {
    // iterate to the name
  }

  return cursor;
}
