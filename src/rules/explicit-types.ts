import { Rule, LintResult, RuleContext } from "./types.js";
import { TerminalKind, TextRange } from "@nomicfoundation/slang/cst";

export class ExplicitTypes implements Rule {
  public static ruleName = "explicit-types";
  public static recommended = true;

  public constructor(
    private readonly criteria: "always" | "never" = "always",
  ) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextTerminalWithKinds([
        TerminalKind.UintKeyword,
        TerminalKind.IntKeyword,
        TerminalKind.UfixedKeyword,
        TerminalKind.FixedKeyword,
      ])
    ) {
      const typeText = cursor.node.unparse();

      if (this.criteria === "always") {
        if (
          typeText === "uint" ||
          typeText === "int" ||
          typeText === "ufixed" ||
          typeText === "fixed"
        ) {
          results.push(
            this._buildLintResult(typeText, file.id, cursor.textRange),
          );
        }
      } else {
        if (
          typeText === "uint256" ||
          typeText === "int256" ||
          typeText === "ufixed256x18" ||
          typeText === "fixed128x18"
        ) {
          results.push(
            this._buildLintResult(typeText, file.id, cursor.textRange),
          );
        }
      }
    }

    return results;
  }

  private _buildLintResult(
    typeText: string,
    sourceId: string,
    textRange: TextRange,
  ): LintResult {
    return {
      rule: ExplicitTypes.ruleName,
      sourceId,
      message: `${this.criteria === "always" ? "implicit" : "explicit"} type '${typeText}' should be avoided`,
      line: textRange.start.line,
      column: textRange.start.column,
    };
  }
}
