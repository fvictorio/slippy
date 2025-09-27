import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "../../../src/rules/types.js";
import { TerminalKind } from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../../../src/slang/trivia.js";

export const StubReplaceUintWithInvalidType: RuleDefinitionWithoutConfig = {
  name: "stub-replace-uint-with-invalid-type",
  recommended: false,
  create: function () {
    return new StubReplaceUintWithInvalidTypeRule(this.name);
  },
};

class StubReplaceUintWithInvalidTypeRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    while (cursor.goToNextTerminalWithKind(TerminalKind.UintKeyword)) {
      const identifier = cursor.node.unparse();

      if (identifier === "uint") {
        const textRangeCursor = cursor.spawn();

        ignoreLeadingTrivia(textRangeCursor);

        const textRange = textRangeCursor.textRange;

        diagnostics.push({
          rule: this.name,
          sourceId: file.id,
          message: `I don't like uints`,
          line: textRange.start.line,
          column: textRange.start.column,
          fix: [
            {
              range: [textRange.start.utf16, textRange.end.utf16],
              replacement: "1nvalidType",
            },
          ],
        });
      }
    }

    return diagnostics;
  }
}
