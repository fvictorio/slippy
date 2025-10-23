import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../slang/trivia.js";

const query = Query.create(`
[EqualityExpression
  [Expression ([TrueKeyword] | [FalseKeyword])]
]
`);

export const NoUnnecessaryBooleanCompare: RuleDefinitionWithoutConfig = {
  name: "no-unnecessary-boolean-compare",
  recommended: true,
  create: function () {
    return new NoUnnecessaryBooleanCompareRule(this.name);
  },
};

class NoUnnecessaryBooleanCompareRule implements RuleWithoutConfig {
  constructor(public readonly name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query([query]);

    for (const match of matches) {
      const positionCursor = match.root.spawn();
      ignoreLeadingTrivia(positionCursor);

      diagnostics.push({
        rule: this.name,
        sourceId: file.id,
        message: "Unnecessary comparison to boolean literal.",
        line: positionCursor.textRange.start.line,
        column: positionCursor.textRange.start.column,
      });
    }

    return diagnostics;
  }
}
