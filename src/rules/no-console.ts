import { File as SlangFile } from "@nomicfoundation/slang/compilation";
import {
  Diagnostic,
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

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const consoleImports = this.getConsoleImports(file);
    diagnostics.push(...consoleImports);

    const memberUsages = this.getConsoleMemberUsages(file);
    diagnostics.push(...memberUsages);

    return diagnostics;
  }

  private getConsoleMemberUsages(file: SlangFile): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
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
        diagnostics.push({
          sourceId: file.id,
          rule: this.name,
          message: "Unexpected console.* usage",
          line: operand.textRange.start.line,
          column: operand.textRange.start.column,
        });
      }
    }

    return diagnostics;
  }

  private getConsoleImports(file: SlangFile): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
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
        diagnostics.push({
          sourceId: file.id,
          rule: this.name,
          message: "Unexpected import of console",
          line: importKeyword.textRange.start.line,
          column: importKeyword.textRange.start.column,
        });
      }
    }

    return diagnostics;
  }
}
