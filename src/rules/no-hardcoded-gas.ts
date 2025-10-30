import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../slang/trivia.js";

const query = Query.create(`
[
  CallOptions [NamedArgument 
    name: ["gas"]
    @optionValue value: [Expression ([DecimalNumberExpression] | [HexNumberExpression])]
  ]
]
`);

export const NoHardcodedGas: RuleDefinitionWithoutConfig = {
  name: "no-hardcoded-gas",
  recommended: true,
  create: function () {
    return new NoHardcodedGasRule(this.name);
  },
};

class NoHardcodedGasRule implements RuleWithoutConfig {
  constructor(public readonly name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query([query]);

    for (const match of matches) {
      const optionValueCursor = match.captures.optionValue[0];

      ignoreLeadingTrivia(optionValueCursor);

      diagnostics.push({
        rule: this.name,
        sourceId: file.id,
        message: "Hardcoded gas value is not allowed",
        line: optionValueCursor.textRange.start.line,
        column: optionValueCursor.textRange.start.column,
      });
    }

    return diagnostics;
  }
}
