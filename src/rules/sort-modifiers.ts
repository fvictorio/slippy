import { File as SlangFile } from "@nomicfoundation/slang/compilation";
import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
  Fix,
} from "./types.js";
import {
  assertNonterminalNode,
  assertTerminalNode,
  Cursor,
  NonterminalKind,
  TerminalKind,
  TerminalKindExtensions,
} from "@nomicfoundation/slang/cst";
import {
  FunctionAttribute,
  StateVariableAttribute,
} from "@nomicfoundation/slang/ast";
import { ignoreLeadingTrivia } from "../slang/trivia.js";

type ModifierKind =
  | "visibility"
  | "mutability"
  | "virtual"
  | "override"
  | "custom";

interface ModifierPosition {
  kind: ModifierKind;
  cursor: Cursor;
}

export const SortModifiers: RuleDefinitionWithoutConfig = {
  name: "sort-modifiers",
  recommended: true,
  create: function () {
    return new SortModifiersRule(this.name);
  },
};

class SortModifiersRule implements RuleWithoutConfig {
  constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const functionModifiersDiagnostics = this._checkFunctionModifiers(
      file,
      cursor.clone(),
    );
    diagnostics.push(...functionModifiersDiagnostics);

    const stateVarModifiersDiagnostics = this._checkStateVarModifiers(
      file,
      cursor.clone(),
    );
    diagnostics.push(...stateVarModifiersDiagnostics);

    return diagnostics;
  }

  private _checkFunctionModifiers(
    file: SlangFile,
    cursor: Cursor,
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    while (
      cursor.goToNextNonterminalWithKinds([
        NonterminalKind.FunctionDefinition,
        NonterminalKind.FallbackFunctionDefinition,
        NonterminalKind.ReceiveFunctionDefinition,
      ])
    ) {
      const functionTextRangeCursor = cursor.spawn();
      while (
        functionTextRangeCursor.goToNextTerminal() &&
        functionTextRangeCursor.node.isTerminalNode() &&
        TerminalKindExtensions.isTrivia(functionTextRangeCursor.node.kind)
      ) {
        // skip trivia nodes
      }
      const functionCursor = cursor.spawn();

      const modifiers: ModifierPosition[] = [];

      while (
        functionCursor.goToNextNonterminalWithKind(
          NonterminalKind.FunctionAttribute,
        )
      ) {
        assertNonterminalNode(functionCursor.node);
        const variant = new FunctionAttribute(functionCursor.node).variant;

        if ("kind" in variant) {
          // we know it's a terminal node
          assertTerminalNode(variant);
          switch (variant.kind) {
            case TerminalKind.ExternalKeyword:
            case TerminalKind.InternalKeyword:
            case TerminalKind.PublicKeyword:
            case TerminalKind.PrivateKeyword:
              modifiers.push({
                kind: "visibility",
                cursor: functionCursor.spawn(),
              });
              break;
            case TerminalKind.ViewKeyword:
            case TerminalKind.PureKeyword:
            case TerminalKind.PayableKeyword:
              modifiers.push({
                kind: "mutability",
                cursor: functionCursor.spawn(),
              });
              break;
            case TerminalKind.VirtualKeyword:
              modifiers.push({
                kind: "virtual",
                cursor: functionCursor.spawn(),
              });
              break;
            case TerminalKind.OverrideKeyword:
              modifiers.push({
                kind: "override",
                cursor: functionCursor.spawn(),
              });
              break;
          }
        } else if ("overrideKeyword" in variant) {
          modifiers.push({
            kind: "override",
            cursor: functionCursor.spawn(),
          });
        } else {
          modifiers.push({
            kind: "custom",
            cursor: functionCursor.spawn(),
          });
        }
      }

      const expectedOrder = {
        visibility: 0,
        mutability: 1,
        virtual: 2,
        override: 3,
        custom: 4,
      };

      diagnostics.push(
        ...this._checkModifiersOrder(file, modifiers, expectedOrder),
      );
    }

    return diagnostics;
  }

  private _checkStateVarModifiers(
    file: SlangFile,
    cursor: Cursor,
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    while (
      cursor.goToNextNonterminalWithKind(
        NonterminalKind.StateVariableDefinition,
      )
    ) {
      const stateVarCursor = cursor.spawn();

      const modifiers: ModifierPosition[] = [];

      while (
        stateVarCursor.goToNextNonterminalWithKind(
          NonterminalKind.StateVariableAttribute,
        )
      ) {
        assertNonterminalNode(stateVarCursor.node);
        const variant = new StateVariableAttribute(stateVarCursor.node).variant;

        if ("kind" in variant) {
          // we know it's a terminal node
          assertTerminalNode(variant);
          switch (variant.kind) {
            case TerminalKind.InternalKeyword:
            case TerminalKind.PublicKeyword:
            case TerminalKind.PrivateKeyword:
              modifiers.push({
                kind: "visibility",
                cursor: stateVarCursor.spawn(),
              });
              break;
            case TerminalKind.ConstantKeyword:
            case TerminalKind.ImmutableKeyword:
            case TerminalKind.TransientKeyword:
              modifiers.push({
                kind: "mutability",
                cursor: stateVarCursor.spawn(),
              });
              break;
          }
        }
      }

      const expectedOrder = {
        visibility: 0,
        mutability: 1,
      };

      diagnostics.push(
        ...this._checkModifiersOrder(file, modifiers, expectedOrder),
      );
    }

    return diagnostics;
  }

  private _checkModifiersOrder(
    file: SlangFile,
    modifiers: ModifierPosition[],
    expectedOrder: Record<string, number>,
  ): Diagnostic[] {
    const sortedModifiers = modifiers.slice().sort((a, b) => {
      return expectedOrder[a.kind] - expectedOrder[b.kind];
    });

    for (let i = 0; i < modifiers.length; i++) {
      const actual = modifiers[i];
      const expected = sortedModifiers[i];

      if (actual.cursor.node.id !== expected.cursor.node.id) {
        // report the position that should be here, not the one that is here
        return [
          this._buildError({
            file,
            expected: extractContent(expected.cursor),
            actual: extractContent(actual.cursor),
            cursor: expected.cursor,
            modifiers,
            sortedModifiers,
          }),
        ];
      }
    }

    return [];
  }

  private _buildError({
    file,
    expected,
    actual,
    cursor,
    modifiers,
    sortedModifiers,
  }: {
    file: SlangFile;
    expected: string;
    actual: string;
    cursor: Cursor;
    modifiers: ModifierPosition[];
    sortedModifiers: ModifierPosition[];
  }): Diagnostic {
    const textRangeCursor = cursor.spawn();
    ignoreLeadingTrivia(textRangeCursor);
    const textRange = textRangeCursor.textRange;

    const fix = this._buildFix(modifiers, sortedModifiers);

    return {
      rule: this.name,
      sourceId: file.id,
      message: `'${expected}' should come before '${actual}'`,
      line: textRange.start.line,
      column: textRange.start.column,
      fix,
    };
  }

  private _buildFix(
    modifiers: ModifierPosition[],
    sortedModifiers: ModifierPosition[],
  ): Fix {
    const fix: Fix = [];

    for (let i = 0; i < modifiers.length; i++) {
      const currentModifier = modifiers[i];
      const expectedModifier = sortedModifiers[i];

      if (currentModifier.cursor.node.id !== expectedModifier.cursor.node.id) {
        fix.push({
          range: [
            currentModifier.cursor.textRange.start.utf16,
            currentModifier.cursor.textRange.end.utf16,
          ],
          replacement: expectedModifier.cursor.node.unparse(),
        });
      }
    }

    return fix;
  }
}

function extractContent(cursor: Cursor): string {
  const contentCursor = cursor.spawn();
  ignoreLeadingTrivia(contentCursor);
  return contentCursor.node.unparse();
}
