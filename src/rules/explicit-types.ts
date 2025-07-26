import * as z from "zod";
import {
  LintResult,
  RuleContext,
  RuleDefinition,
  RuleWithConfig,
} from "./types.js";
import { TerminalKind, TextRange } from "@nomicfoundation/slang/cst";

const ConfigSchema = z.enum(["always", "never"]).default("always");

type Config = z.infer<typeof ConfigSchema>;

export const ExplicitTypes: RuleDefinition<Config> = {
  name: "explicit-types",
  recommended: true,
  parseConfig: (config: unknown) => {
    return ConfigSchema.parse(config);
  },
  create: function (config) {
    return new ExplicitTypesRule(this.name, config);
  },
};

class ExplicitTypesRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
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

      if (this.config === "always") {
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
      rule: this.name,
      sourceId,
      message: `${this.config === "always" ? "implicit" : "explicit"} type '${typeText}' should be avoided`,
      line: textRange.start.line,
      column: textRange.start.column,
    };
  }
}
