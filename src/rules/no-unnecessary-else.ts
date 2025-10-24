import { Statements } from "@nomicfoundation/slang/ast";
import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithoutConfig,
  RuleWithoutConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  Cursor,
  NonterminalKind,
  Query,
  QueryMatch,
  TextIndexExtensions,
} from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../slang/trivia.js";
import { matchesQuery } from "../slang/queries.js";

const query = Query.create(`
[
  IfStatement
    body: [Statement @body [_]]
    [ElseBranch @else [ElseKeyword]]
]
`);

export const NoUnnecessaryElse: RuleDefinitionWithoutConfig = {
  name: "no-unnecessary-else",
  recommended: true,
  create: function () {
    return new NoUnnecessaryElseRule(this.name);
  },
};

class NoUnnecessaryElseRule implements RuleWithoutConfig {
  constructor(public readonly name: string) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = [...cursor.query([query])].filter((match) =>
      this._isUnnecessaryElse(match),
    );

    for (const match of matches) {
      const elseKeyword = match.captures.else[0].spawn();

      ignoreLeadingTrivia(elseKeyword);

      diagnostics.push({
        rule: this.name,
        sourceId: file.id,
        message: "Unnecessary 'else' after 'if' block that returns",
        line: elseKeyword.textRange.start.line,
        column: elseKeyword.textRange.start.column,
      });
    }

    return diagnostics;
  }

  private _isUnnecessaryElse(match: QueryMatch): boolean {
    const ifBody = match.captures.body[0];

    if (this._isTerminatingStatement(ifBody)) {
      return true;
    }

    if (ifBody.node.kind !== NonterminalKind.Block) {
      return false;
    }

    const statementsCursor = ifBody.spawn();

    if (
      !statementsCursor.goToNextNonterminalWithKind(NonterminalKind.Statements)
    ) {
      return false;
    }

    assertNonterminalNode(statementsCursor.node, NonterminalKind.Statements);
    const statements = new Statements(statementsCursor.node);

    if (statements.items.length === 0) {
      return false;
    }

    const lastStatement = statements.items[statements.items.length - 1].variant;

    const lastStatementCursor = lastStatement.cst.createCursor(
      TextIndexExtensions.zero(),
    );

    if (this._isTerminatingStatement(lastStatementCursor)) {
      return true;
    }

    return false;
  }

  private _isTerminatingStatement(statementCursor: Cursor): boolean {
    if (statementCursor.node.kind === NonterminalKind.ReturnStatement) {
      return true;
    }

    if (statementCursor.node.kind === NonterminalKind.RevertStatement) {
      return true;
    }

    if (statementCursor.node.kind === NonterminalKind.ContinueStatement) {
      return true;
    }

    if (statementCursor.node.kind === NonterminalKind.BreakStatement) {
      return true;
    }

    if (statementCursor.node.kind === NonterminalKind.ExpressionStatement) {
      return matchesQuery(
        statementCursor,
        `
[
  ExpressionStatement [Expression [FunctionCallExpression
    operand: [Expression ["require"]]
    arguments: [ArgumentsDeclaration [PositionalArgumentsDeclaration [PositionalArguments
      .
      [Expression [FalseKeyword]]
    ]]]
  ]]
]
      `,
      );
    }

    return false;
  }
}
