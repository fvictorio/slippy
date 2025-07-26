import { File as SlangFile } from "@nomicfoundation/slang/compilation";
import {
  LintResult,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";

const forbiddenImportPaths = [
  "hardhat/console.sol",
  "forge-std/console.sol",
  "forge-std/console2.sol",
  "forge-std/safeconsole.sol",
  "forge-std/src/console.sol",
  "forge-std/src/console2.sol",
  "forge-std/src/safeconsole.sol",
];

export const NoConsole: RuleDefinitionWithoutConfig = {
  name: "no-console",
  recommended: true,
  create: function () {
    return new NoConsoleRule(this.name);
  },
};

class NoConsoleRule implements RuleWithoutConfig {
  constructor(public readonly name: string) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const consoleImports = this.getConsoleImports(file);
    results.push(...consoleImports);

    const memberUsages = this.getConsoleMemberUsages(file);
    results.push(...memberUsages);

    return results;
  }

  private getConsoleMemberUsages(file: SlangFile): LintResult[] {
    const results: LintResult[] = [];
    const cursor = file.createTreeCursor();
    const matches = [
      ...cursor.query([
        Query.create(`
[MemberAccessExpression
  operand: [Expression @operand ["console"]]
  @member member: [Identifier]
]
`),
      ]),
    ];

    for (const match of matches) {
      const operand = match.captures.operand[0];
      const member = match.captures.member[0];
      if (member.node.unparse().trim().startsWith("log")) {
        results.push({
          sourceId: file.id,
          rule: this.name,
          message: "Unexpected console.* usage",
          line: operand.textRange.start.line,
          column: operand.textRange.start.column,
        });
      }
    }

    return results;
  }

  private getConsoleImports(file: SlangFile): LintResult[] {
    const results: LintResult[] = [];
    const cursor = file.createTreeCursor();
    const matches = [
      ...cursor.query([
        Query.create(`
[ImportDirective
  @importKeyword import_keyword: [ImportKeyword]
  clause: [ImportClause [_ @importPath [StringLiteral]]]
]
`),
      ]),
    ];

    for (const match of matches) {
      const importKeyword = match.captures.importKeyword[0];
      const importPath = match.captures.importPath[0].node
        .unparse()
        .trim()
        .slice(1, -1);

      if (forbiddenImportPaths.includes(importPath)) {
        results.push({
          sourceId: file.id,
          rule: this.name,
          message: "Unexpected import of console",
          line: importKeyword.textRange.start.line,
          column: importKeyword.textRange.start.column,
        });
      }
    }

    return results;
  }
}
