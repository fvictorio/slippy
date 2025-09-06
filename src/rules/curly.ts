import {
  Block,
  DoWhileStatement,
  ElseBranch,
  ForStatement,
  IfStatement,
  WhileStatement,
} from "@nomicfoundation/slang/ast";
import {
  LintResult,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  Cursor,
  NonterminalKind,
  TerminalKind,
  TerminalKindExtensions,
} from "@nomicfoundation/slang/cst";
import { File as SlangFile } from "@nomicfoundation/slang/compilation";

const name = "curly";

export const Curly: RuleDefinitionWithoutConfig = {
  name,
  recommended: false,
  create: function () {
    return new CurlyRule(this.name);
  },
};

class CurlyRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKinds([
        NonterminalKind.IfStatement,
        NonterminalKind.ElseBranch,
        NonterminalKind.WhileStatement,
        NonterminalKind.ForStatement,
        NonterminalKind.DoWhileStatement,
      ])
    ) {
      if (cursor.node.kind === NonterminalKind.IfStatement) {
        results.push(...this.checkIfStatement(cursor.spawn(), file));
      } else if (cursor.node.kind === NonterminalKind.ElseBranch) {
        results.push(...this.checkElseBranch(cursor.spawn(), file));
      } else if (cursor.node.kind === NonterminalKind.WhileStatement) {
        results.push(...this.checkWhileStatement(cursor.spawn(), file));
      } else if (cursor.node.kind === NonterminalKind.ForStatement) {
        results.push(...this.checkForStatement(cursor.spawn(), file));
      } else if (cursor.node.kind === NonterminalKind.DoWhileStatement) {
        results.push(...this.checkDoWhileStatement(cursor.spawn(), file));
      }
    }

    return results;
  }

  private checkIfStatement(cursor: Cursor, file: SlangFile): LintResult[] {
    assertNonterminalNode(cursor.node, NonterminalKind.IfStatement);
    const ifStatement = new IfStatement(cursor.node);

    if (ifStatement.body.variant instanceof Block) {
      return [];
    }

    if (!cursor.goToNextTerminalWithKind(TerminalKind.CloseParen)) {
      return [];
    }
    ignoreTrivia(cursor);

    return [
      {
        rule: this.name,
        sourceId: file.id,
        line: cursor.textRange.start.line,
        column: cursor.textRange.start.column,
        message: "Expected { after 'if' condition",
      },
    ];
  }

  private checkElseBranch(cursor: Cursor, file: SlangFile): LintResult[] {
    assertNonterminalNode(cursor.node, NonterminalKind.ElseBranch);
    const elseBranch = new ElseBranch(cursor.node);

    if (
      elseBranch.body.variant instanceof Block ||
      elseBranch.body.variant instanceof IfStatement
    ) {
      return [];
    }

    if (!cursor.goToNextTerminalWithKind(TerminalKind.ElseKeyword)) {
      return [];
    }
    ignoreTrivia(cursor);

    return [
      {
        rule: this.name,
        sourceId: file.id,
        line: cursor.textRange.start.line,
        column: cursor.textRange.start.column,
        message: "Expected { after 'else'",
      },
    ];
  }

  private checkWhileStatement(cursor: Cursor, file: SlangFile): LintResult[] {
    assertNonterminalNode(cursor.node, NonterminalKind.WhileStatement);
    const whileStatement = new WhileStatement(cursor.node);

    if (whileStatement.body.variant instanceof Block) {
      return [];
    }

    if (!cursor.goToNextTerminalWithKind(TerminalKind.CloseParen)) {
      return [];
    }
    ignoreTrivia(cursor);

    return [
      {
        rule: this.name,
        sourceId: file.id,
        line: cursor.textRange.start.line,
        column: cursor.textRange.start.column,
        message: "Expected { after 'while' condition",
      },
    ];
  }

  private checkForStatement(cursor: Cursor, file: SlangFile): LintResult[] {
    assertNonterminalNode(cursor.node, NonterminalKind.ForStatement);
    const forStatement = new ForStatement(cursor.node);

    if (forStatement.body.variant instanceof Block) {
      return [];
    }

    if (!cursor.goToNextTerminalWithKind(TerminalKind.CloseParen)) {
      return [];
    }
    ignoreTrivia(cursor);

    return [
      {
        rule: this.name,
        sourceId: file.id,
        line: cursor.textRange.start.line,
        column: cursor.textRange.start.column,
        message: "Expected { after 'for' condition",
      },
    ];
  }

  private checkDoWhileStatement(cursor: Cursor, file: SlangFile): LintResult[] {
    assertNonterminalNode(cursor.node, NonterminalKind.DoWhileStatement);
    const doWhileStatement = new DoWhileStatement(cursor.node);

    if (doWhileStatement.body.variant instanceof Block) {
      return [];
    }

    if (!cursor.goToNextTerminalWithKind(TerminalKind.DoKeyword)) {
      return [];
    }
    ignoreTrivia(cursor);

    return [
      {
        rule: this.name,
        sourceId: file.id,
        line: cursor.textRange.start.line,
        column: cursor.textRange.start.column,
        message: "Expected { after 'do'",
      },
    ];
  }
}

function ignoreTrivia(cursor: Cursor): void {
  while (
    cursor.goToNextTerminal() &&
    cursor.node.isTerminalNode() &&
    TerminalKindExtensions.isTrivia(cursor.node.kind)
  ) {
    // Skip trivia
  }
}
