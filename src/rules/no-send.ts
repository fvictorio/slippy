import { ignoreLeadingTrivia } from "../slang/trivia.js";
import {
  Diagnostic,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";

const TRANSFER_OR_SEND_QUERY = Query.create(`
[FunctionCallExpression
  operand: [Expression
    [MemberAccessExpression
      @method (member: ["transfer"] | member: ["send"])
    ]
  ]
  arguments: [ArgumentsDeclaration [PositionalArgumentsDeclaration [PositionalArguments
    .
    [Expression]
    .
  ]]]
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

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query([TRANSFER_OR_SEND_QUERY]);

    for (const match of matches) {
      const textRangeCursor = match.root.spawn();
      ignoreLeadingTrivia(textRangeCursor);
      const textRange = textRangeCursor.textRange;

      const method = match.captures.method[0].node.unparse().trim();

      diagnostics.push({
        rule: this.name,
        sourceId: file.id,
        line: textRange.start.line,
        column: textRange.start.column,
        message: `Avoid using '.${method}(amount)'. Use '.call{value: amount}("")' instead.`,
      });
    }

    return diagnostics;
  }
}
