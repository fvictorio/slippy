import { File as SlangFile } from "@nomicfoundation/slang/compilation";
import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  assertTerminalNode,
  Cursor,
  NonterminalKind,
  TerminalKind,
  TerminalKindExtensions,
  TextRange,
} from "@nomicfoundation/slang/cst";
import {
  FunctionAttribute,
  StateVariableAttribute,
} from "@nomicfoundation/slang/ast";
import { ignoreLeadingTrivia } from "../slang/trivia.js";

type FunctionModifierKind =
  | "visibility"
  | "mutability"
  | "virtual"
  | "override"
  | "custom";

interface FunctionModifierPosition {
  kind: FunctionModifierKind;
  textRange: TextRange;
}

type StateVarModifierKind = "visibility" | "mutability";

interface StateVarModifierPosition {
  kind: StateVarModifierKind;
  textRange: TextRange;
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

      const modifiers: FunctionModifierPosition[] = [];

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
              ignoreLeadingTrivia(functionCursor);
              modifiers.push({
                kind: "visibility",
                textRange: functionCursor.textRange,
              });
              break;
            case TerminalKind.ViewKeyword:
            case TerminalKind.PureKeyword:
            case TerminalKind.PayableKeyword:
              ignoreLeadingTrivia(functionCursor);
              modifiers.push({
                kind: "mutability",
                textRange: functionCursor.textRange,
              });
              break;
            case TerminalKind.VirtualKeyword:
              ignoreLeadingTrivia(functionCursor);
              modifiers.push({
                kind: "virtual",
                textRange: functionCursor.textRange,
              });
              break;
            case TerminalKind.OverrideKeyword:
              ignoreLeadingTrivia(functionCursor);
              modifiers.push({
                kind: "override",
                textRange: functionCursor.textRange,
              });
              break;
          }
        } else if ("overrideKeyword" in variant) {
          ignoreLeadingTrivia(functionCursor);
          modifiers.push({
            kind: "override",
            textRange: functionCursor.textRange,
          });
        } else {
          ignoreLeadingTrivia(functionCursor);
          modifiers.push({
            kind: "custom",
            textRange: functionCursor.textRange,
          });
        }
      }

      const modifiersIndices = [
        {
          kind: "visibility",
          index: modifiers.findIndex((m) => m.kind === "visibility"),
        },
        {
          kind: "mutability",
          index: modifiers.findIndex((m) => m.kind === "mutability"),
        },
        {
          kind: "virtual",
          index: modifiers.findIndex((m) => m.kind === "virtual"),
        },
        {
          kind: "override",
          index: modifiers.findIndex((m) => m.kind === "override"),
        },
        {
          kind: "custom",
          index: modifiers.findIndex((m) => m.kind === "custom"),
        },
      ];

      diagnostics.push(
        ...this._checkModifiersOrder(file, modifiers, modifiersIndices),
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

      const modifiers: StateVarModifierPosition[] = [];

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
              ignoreLeadingTrivia(stateVarCursor);
              modifiers.push({
                kind: "visibility",
                textRange: stateVarCursor.textRange,
              });
              break;
            case TerminalKind.ConstantKeyword:
            case TerminalKind.ImmutableKeyword:
            case TerminalKind.TransientKeyword:
              ignoreLeadingTrivia(stateVarCursor);
              modifiers.push({
                kind: "mutability",
                textRange: stateVarCursor.textRange,
              });
              break;
          }
        }
      }

      const modifiersIndices = [
        {
          kind: "visibility",
          index: modifiers.findIndex((m) => m.kind === "visibility"),
        },
        {
          kind: "mutability",
          index: modifiers.findIndex((m) => m.kind === "mutability"),
        },
      ];

      diagnostics.push(
        ...this._checkModifiersOrder(file, modifiers, modifiersIndices),
      );
    }

    return diagnostics;
  }

  private _checkModifiersOrder(
    file: SlangFile,
    modifiers:
      | Array<FunctionModifierPosition>
      | Array<StateVarModifierPosition>,
    modifiersIndices: Array<{ kind: string; index: number }>,
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    for (let i = 0; i < modifiersIndices.length - 1; i++) {
      for (let k = i + 1; k < modifiersIndices.length; k++) {
        const first = modifiersIndices[i];
        const second = modifiersIndices[k];

        if (
          first.index !== -1 &&
          second.index !== -1 &&
          first.index > second.index
        ) {
          return [
            this._buildError(
              file,
              first.kind,
              second.kind,
              modifiers[second.index].textRange,
            ),
          ];
        }
      }
    }

    return diagnostics;
  }

  private _buildError(
    file: SlangFile,
    first: string,
    second: string,
    textRange: TextRange,
  ): Diagnostic {
    return {
      rule: this.name,
      sourceId: file.id,
      message: `${first} modifier should come before ${second} modifier`,
      line: textRange.start.line,
      column: textRange.start.column,
    };
  }
}
