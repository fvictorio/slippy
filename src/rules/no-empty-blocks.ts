import {
  ConstructorAttributes,
  ContractMembers,
  InterfaceMembers,
  LibraryMembers,
  ModifierInvocation,
  Statements,
  YulStatements,
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
  Query,
  QueryMatch,
  TerminalKind,
} from "@nomicfoundation/slang/cst";
import { File as SlangFile } from "@nomicfoundation/slang/compilation";

const name = "no-empty-blocks";

interface QueryHandler {
  query: string;
  handler: (file: SlangFile, match: QueryMatch) => LintResult[];
}

function checkEmptyBlock(
  file: SlangFile,
  root: Cursor,
  isEmpty: boolean,
  openBrace: Cursor,
  closeBrace: Cursor,
): LintResult[] {
  if (isEmpty) {
    // check if it has comments
    const commentCursor = root.spawn();
    if (
      commentCursor.goToNextTerminalWithKinds([
        TerminalKind.SingleLineComment,
        TerminalKind.MultiLineComment,
      ])
    ) {
      const commentInsideBlock =
        commentCursor.textRange.start.utf8 > openBrace.textRange.end.utf8 &&
        commentCursor.textRange.end.utf8 < closeBrace.textRange.start.utf8;

      if (commentInsideBlock) {
        return [];
      }
    }

    return [
      {
        rule: name,
        sourceId: file.id,
        line: openBrace.textRange.start.line,
        column: openBrace.textRange.start.column,
        message: `Empty blocks are not allowed`,
      },
    ];
  }

  return [];
}

const handlers: QueryHandler[] = [
  {
    query: `
[ContractDefinition
  @openBrace open_brace: [OpenBrace]
  @members members: [ContractMembers]
  @closeBrace close_brace: [CloseBrace]
]
`,
    handler: (file: SlangFile, match: QueryMatch): LintResult[] => {
      const hasInheritanceSpecifiers = checkHasInheritanceSpecifier(
        match.root.clone(),
      );

      if (hasInheritanceSpecifiers) {
        return [];
      }

      const openBrace = match.captures.openBrace[0];
      const members = match.captures.members[0];
      const closeBrace = match.captures.closeBrace[0];

      assertNonterminalNode(members.node);
      const membersAst = new ContractMembers(members.node);
      const isEmpty = membersAst.items.length === 0;

      return checkEmptyBlock(file, match.root, isEmpty, openBrace, closeBrace);
    },
  },
  {
    query: `
[InterfaceDefinition
  @openBrace open_brace: [OpenBrace]
  @members members: [InterfaceMembers]
  @closeBrace close_brace: [CloseBrace]
]
`,
    handler: (file: SlangFile, match: QueryMatch): LintResult[] => {
      const hasInheritanceSpecifiers = checkHasInheritanceSpecifier(
        match.root.clone(),
      );

      if (hasInheritanceSpecifiers) {
        return [];
      }

      const openBrace = match.captures.openBrace[0];
      const members = match.captures.members[0];
      const closeBrace = match.captures.closeBrace[0];

      assertNonterminalNode(members.node);
      const membersAst = new InterfaceMembers(members.node);
      const isEmpty = membersAst.items.length === 0;

      return checkEmptyBlock(file, match.root, isEmpty, openBrace, closeBrace);
    },
  },
  {
    query: `
[LibraryDefinition
  @openBrace open_brace: [OpenBrace]
  @members members: [LibraryMembers]
  @closeBrace close_brace: [CloseBrace]
]
`,
    handler: (file: SlangFile, match: QueryMatch): LintResult[] => {
      const openBrace = match.captures.openBrace[0];
      const members = match.captures.members[0];
      const closeBrace = match.captures.closeBrace[0];

      assertNonterminalNode(members.node);
      const membersAst = new LibraryMembers(members.node);
      const isEmpty = membersAst.items.length === 0;

      return checkEmptyBlock(file, match.root, isEmpty, openBrace, closeBrace);
    },
  },
  {
    query: `
[Block
  @openBrace open_brace: [OpenBrace]
  @statements statements: [Statements]
  @closeBrace close_brace: [CloseBrace]
]
`,
    handler: (file: SlangFile, match: QueryMatch): LintResult[] => {
      const isVirtual = checkIsVirtual(match.root.clone());
      const isConstructorWithBase = checkIsValidConstructor(match.root.clone());
      const isFallbackOrReceive = checkIsFallbackOrReceive(match.root.clone());

      if (isVirtual || isConstructorWithBase || isFallbackOrReceive) {
        return [];
      }

      const openBrace = match.captures.openBrace[0];
      const statements = match.captures.statements[0];
      const closeBrace = match.captures.closeBrace[0];

      assertNonterminalNode(statements.node);
      const membersAst = new Statements(statements.node);
      const isEmpty = membersAst.items.length === 0;

      return checkEmptyBlock(file, match.root, isEmpty, openBrace, closeBrace);
    },
  },
  {
    query: `
[YulBlock
  @openBrace open_brace: [OpenBrace]
  @statements statements: [YulStatements]
  @closeBrace close_brace: [CloseBrace]
]
`,
    handler: (file: SlangFile, match: QueryMatch): LintResult[] => {
      const openBrace = match.captures.openBrace[0];
      const statements = match.captures.statements[0];
      const closeBrace = match.captures.closeBrace[0];

      assertNonterminalNode(statements.node);
      const membersAst = new YulStatements(statements.node);
      const isEmpty = membersAst.items.length === 0;

      return checkEmptyBlock(file, match.root, isEmpty, openBrace, closeBrace);
    },
  },
];

export const NoEmptyBlocks: RuleDefinitionWithoutConfig = {
  name,
  recommended: true,
  create: function () {
    return new NoEmptyBlocksRule(this.name);
  },
};

class NoEmptyBlocksRule implements RuleWithoutConfig {
  public constructor(public name: string) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    const queries = handlers.map((handler) => handler.query);

    const matches = cursor.query(queries.map((query) => Query.create(query)));

    for (const match of matches) {
      const handler = handlers[match.queryIndex];
      results.push(...handler.handler(file, match));
    }

    return results;
  }
}

function checkIsVirtual(cursor: Cursor): boolean {
  // function body
  if (!cursor.goToParent()) {
    return false;
  }

  // function definition
  if (!cursor.goToParent()) {
    return false;
  }

  if (!cursor.goToNextNonterminalWithKind(NonterminalKind.FunctionAttributes)) {
    return false;
  }

  const functionAttributesCursor = cursor.spawn();
  return functionAttributesCursor.goToNextTerminalWithKind(
    TerminalKind.VirtualKeyword,
  );
}

/**
 * Checks if the constructor is valid, meaning:
 * - It has a base constructor call
 * - It has modifiers other than `public`
 */
function checkIsValidConstructor(cursor: Cursor): boolean {
  // constructor definition
  if (!cursor.goToParent()) {
    return false;
  }

  if (
    !cursor.goToNextNonterminalWithKind(NonterminalKind.ConstructorAttributes)
  ) {
    return false;
  }

  assertNonterminalNode(cursor.node);
  const attributes = new ConstructorAttributes(cursor.node);

  return (
    attributes.items.filter(
      (x) =>
        x.variant instanceof ModifierInvocation ||
        x.variant.kind !== TerminalKind.PublicKeyword,
    ).length > 0
  );
}

function checkIsFallbackOrReceive(cursor: Cursor): boolean {
  if (!cursor.goToParent()) {
    return false;
  }
  if (!cursor.goToParent()) {
    return false;
  }

  return (
    cursor.node.kind === NonterminalKind.FallbackFunctionDefinition ||
    cursor.node.kind === NonterminalKind.ReceiveFunctionDefinition
  );
}

function checkHasInheritanceSpecifier(cursor: Cursor): boolean {
  return cursor.goToNextNonterminalWithKind(
    NonterminalKind.InheritanceSpecifier,
  );
}
