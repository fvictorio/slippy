import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../slang/trivia.js";

const queries = [
  `
[YulFunctionCallExpression
  operand: [YulExpression [YulPath ["eq"]]]
  arguments: [YulArguments [YulExpression] [Comma] [YulExpression [YulLiteral ["0"]]]]
]
`,
  `
[YulFunctionCallExpression
  operand: [YulExpression [YulPath ["eq"]]]
  arguments: [YulArguments [YulExpression [YulLiteral ["0"]]] [Comma] [YulExpression]]
]
  `,
].map((query) => Query.create(query));

export const YulPreferIszero: RuleDefinitionWithoutConfig = {
  name: "yul-prefer-iszero",
  recommended: true,
  create: function () {
    return new YulPreferIszeroRule(this.name);
  },
};

class YulPreferIszeroRule implements RuleWithoutConfig {
  constructor(public readonly name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query(queries);

    for (const match of matches) {
      const matchCursor = match.root.spawn();

      ignoreLeadingTrivia(matchCursor);

      diagnostics.push({
        sourceId: file.id,
        rule: this.name,
        message: "Found 'eq' comparison to 0, use 'iszero' instead",
        line: matchCursor.textRange.start.line,
        column: matchCursor.textRange.start.column,
      });
    }

    return diagnostics;
  }
}
