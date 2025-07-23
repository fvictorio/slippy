import { File as SlangFile } from "@nomicfoundation/slang/compilation";
import { Rule, LintResult, RuleContext } from "./types.js";
import {
  assertNonterminalNode,
  assertTerminalNode,
  Cursor,
  NonterminalKind,
  TerminalKind,
  TerminalKindExtensions,
  TextRange,
} from "@nomicfoundation/slang/cst";
import { FunctionAttribute } from "@nomicfoundation/slang/ast";

type ModifierKind =
  | "visibility"
  | "mutability"
  | "virtual"
  | "override"
  | "custom";

interface ModifierPosition {
  kind: ModifierKind;
  textRange: TextRange;
}

export class SortModifiers implements Rule {
  public static ruleName = "sort-modifiers";
  public static recommended = true;

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

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
              ignoreTrivia(functionCursor);
              modifiers.push({
                kind: "visibility",
                textRange: functionCursor.textRange,
              });
              break;
            case TerminalKind.ViewKeyword:
            case TerminalKind.PureKeyword:
            case TerminalKind.PayableKeyword:
              ignoreTrivia(functionCursor);
              modifiers.push({
                kind: "mutability",
                textRange: functionCursor.textRange,
              });
              break;
            case TerminalKind.VirtualKeyword:
              ignoreTrivia(functionCursor);
              modifiers.push({
                kind: "virtual",
                textRange: functionCursor.textRange,
              });
              break;
            case TerminalKind.OverrideKeyword:
              ignoreTrivia(functionCursor);
              modifiers.push({
                kind: "override",
                textRange: functionCursor.textRange,
              });
              break;
          }
        } else if ("overrideKeyword" in variant) {
          ignoreTrivia(functionCursor);
          modifiers.push({
            kind: "override",
            textRange: functionCursor.textRange,
          });
        } else {
          ignoreTrivia(functionCursor);
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
    }

    return results;
  }

  private _buildError(
    file: SlangFile,
    first: string,
    second: string,
    textRange: TextRange,
  ): LintResult {
    return {
      rule: SortModifiers.ruleName,
      sourceId: file.id,
      message: `${first} modifier should come before ${second} modifier`,
      line: textRange.start.line,
      column: textRange.start.column,
    };
  }
}

function ignoreTrivia(cursor: Cursor) {
  cursor.goToNextTerminal();
  while (
    cursor.node.isTerminalNode() &&
    TerminalKindExtensions.isTrivia(cursor.node.kind) &&
    cursor.goToNext()
  ) {
    // skip trivia nodes
  }
}
