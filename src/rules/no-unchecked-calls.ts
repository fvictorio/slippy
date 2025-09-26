import { ignoreLeadingTrivia } from "../slang/trivia.js";
import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";

// matches statements like `target.call(data);`
const MEMBER_ACCESS_CALL_QUERY = Query.create(`
[ExpressionStatement [Expression [FunctionCallExpression
  operand: [Expression [MemberAccessExpression
    (member: ["call"] | member: ["delegatecall"] | member: ["staticcall"])
  ]]
]]]
`);

// matches statements like `target.call{value: 1}(data);`
const CALL_OPTIONS_CALL_QUERY = Query.create(`
[ExpressionStatement [Expression [FunctionCallExpression
  operand: [Expression [CallOptionsExpression [Expression [MemberAccessExpression
    (member: ["call"] | member: ["delegatecall"] | member: ["staticcall"])
  ]]]]
]]]
`);

export const NoUncheckedCalls: RuleDefinitionWithoutConfig = {
  name: "no-unchecked-calls",
  recommended: true,
  create: function () {
    return new NoUncheckedCallsRule(this.name);
  },
};

class NoUncheckedCallsRule implements RuleWithoutConfig {
  constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query([
      MEMBER_ACCESS_CALL_QUERY,
      CALL_OPTIONS_CALL_QUERY,
    ]);

    for (const match of matches) {
      const textRangeCursor = match.root.spawn();
      ignoreLeadingTrivia(textRangeCursor);

      diagnostics.push({
        rule: this.name,
        sourceId: file.id,
        line: textRangeCursor.textRange.start.line,
        column: textRangeCursor.textRange.start.column,
        message: "Unchecked calls are not allowed",
      });
    }

    return diagnostics;
  }
}
