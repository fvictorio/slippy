import {
  Diagnostic,
  RuleContext,
  RuleDefinition,
  RuleWithConfig,
} from "../../../src/rules/types.js";
import { TerminalKind } from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../../../src/slang/trivia.js";

type Config = Record<string, string>;

export const StubNoForbiddenIdentifiers: RuleDefinition<Config> = {
  name: "stub-no-forbidden-identifiers",
  recommended: false,
  parseConfig(config: unknown) {
    return config as Config;
  },
  create: function (config: Config) {
    return new StubNoForbiddenIdentifiersRule(this.name, config);
  },
};

class StubNoForbiddenIdentifiersRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    while (cursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
      const identifier = cursor.node.unparse();

      if (identifier in this.config) {
        const textRangeCursor = cursor.spawn();

        ignoreLeadingTrivia(textRangeCursor);

        const textRange = textRangeCursor.textRange;

        diagnostics.push({
          rule: this.name,
          sourceId: file.id,
          message: `Forbidden identifier ${identifier}`,
          line: textRange.start.line,
          column: textRange.start.column,
          fix: [
            {
              range: [textRange.start.utf16, textRange.end.utf16],
              replacement: this.config[identifier],
            },
          ],
        });
      }
    }

    return diagnostics;
  }
}
