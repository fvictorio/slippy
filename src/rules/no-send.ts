import { ignoreLeadingTrivia } from "../slang/trivia.js";
import {
  LintResult,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";

const TRANSFER_QUERY = Query.create(`
[FunctionCallExpression
  operand: [Expression
    [MemberAccessExpression
      member: ["transfer"]
    ]
  ]
]`);

const SEND_QUERY = Query.create(`
[FunctionCallExpression
  operand: [Expression
    [MemberAccessExpression
      member: ["send"]
    ]
  ]
]`);

export const NoSend: RuleDefinitionWithoutConfig = {
  name: "no-send",
  recommended: true,
  create: function () {
    return new NoSendRule(this.name);
  },
};

class NoSendRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query([TRANSFER_QUERY, SEND_QUERY]);

    for (const match of matches) {
      const textRangeCursor = match.root.spawn();
      ignoreLeadingTrivia(textRangeCursor);
      const textRange = textRangeCursor.textRange;

      const method = match.queryIndex === 0 ? "transfer" : "send";

      results.push({
        rule: this.name,
        sourceId: file.id,
        line: textRange.start.line,
        column: textRange.start.column,
        message: `Avoid using '.${method}(amount)'. Use '.call{value: amount}("")' instead.`,
      });
    }

    return results;
  }
}
