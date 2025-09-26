import {
  PositionalArguments,
  StringExpression,
} from "@nomicfoundation/slang/ast";
import {
  Diagnostic,
  RuleContext,
  RuleWithConfig,
  RuleDefinitionWithConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  Cursor,
  Query,
  TerminalKindExtensions,
} from "@nomicfoundation/slang/cst";
import { File as SlangFile } from "@nomicfoundation/slang/compilation";
import * as z from "zod";

const GET_REQUIRE_ARGS_QUERY = Query.create(`
[FunctionCallExpression
  operand: [Expression ["require"]]
  arguments: [ArgumentsDeclaration [PositionalArgumentsDeclaration
    @requireArgs arguments: [PositionalArguments]
  ]]
]
`);

const GET_REVERT_FUNCTION_ARGS_QUERY = Query.create(`
[RevertStatement
  [RevertKeyword]
  .
  [ArgumentsDeclaration [PositionalArgumentsDeclaration
    @revertFunctionArgs arguments: [PositionalArguments]
  ]]
]
`);

const GET_REVERT_STATEMENT_ARGS_QUERY = Query.create(`
[RevertStatement
  [RevertKeyword]
  [IdentifierPath]
  [ArgumentsDeclaration [PositionalArgumentsDeclaration
    @revertStatementArgs arguments: [PositionalArguments]
  ]]
]
`);

const Schema = z.enum(["any", "string", "customError"]).default("any");

type Config = z.infer<typeof Schema>;

export const RequireRevertReason: RuleDefinitionWithConfig<Config> = {
  name: "require-revert-reason",
  recommended: true,
  parseConfig: (config: unknown) => Schema.parse(config),
  create: function (config: Config) {
    return new RequireRevertReasonRule(this.name, config);
  },
};

class RequireRevertReasonRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query([
      GET_REQUIRE_ARGS_QUERY,
      GET_REVERT_FUNCTION_ARGS_QUERY,
      GET_REVERT_STATEMENT_ARGS_QUERY,
    ]);

    for (const match of matches) {
      const requireArgs = match.captures.requireArgs?.[0];
      const revertFunctionArgs = match.captures.revertFunctionArgs?.[0];
      const revertStatementArgs = match.captures.revertStatementArgs?.[0];

      const node = (requireArgs ?? revertFunctionArgs ?? revertStatementArgs)
        .node;
      assertNonterminalNode(node);
      const args = new PositionalArguments(node);

      if (requireArgs !== undefined) {
        if (args.items.length === 1) {
          diagnostics.push(
            this.makeResult(file, match.root, "require", "missingReason"),
          );
        } else if (args.items.length === 2) {
          const isStringReason =
            args.items[1].variant instanceof StringExpression;
          if (this.config === "customError" && isStringReason) {
            diagnostics.push(
              this.makeResult(file, match.root, "require", "notError"),
            );
          } else if (this.config === "string" && !isStringReason) {
            diagnostics.push(
              this.makeResult(file, match.root, "require", "notString"),
            );
          }
        }
      } else if (revertFunctionArgs !== undefined) {
        if (args.items.length === 0) {
          diagnostics.push(
            this.makeResult(file, match.root, "revert", "missingReason"),
          );
        } else if (args.items.length === 1) {
          const isStringReason =
            args.items[0].variant instanceof StringExpression;
          if (this.config === "customError" && isStringReason) {
            diagnostics.push(
              this.makeResult(file, match.root, "revert", "notError"),
            );
          } else if (this.config === "string" && !isStringReason) {
            diagnostics.push(
              this.makeResult(file, match.root, "revert", "notString"),
            );
          }
        }
      } else if (revertStatementArgs !== undefined) {
        // revert statements always have a reason of error kind
        if (this.config === "string") {
          diagnostics.push(
            this.makeResult(file, match.root, "revert", "notString"),
          );
        }
      }
    }

    return diagnostics;
  }

  private makeResult(
    file: SlangFile,
    cursor: Cursor,
    name: "require" | "revert",
    cause: "missingReason" | "notError" | "notString",
  ): Diagnostic {
    ignoreLeadingTrivia(cursor);

    let message: string;
    if (cause === "missingReason") {
      message = `Missing revert reason in ${name} statement`;
    } else if (cause === "notError") {
      message = `Revert reason in ${name} should be an error`;
    } else {
      message = `Revert reason in ${name} should be a string`;
    }

    return {
      rule: this.name,
      sourceId: file.id,
      message,
      line: cursor.textRange.start.line,
      column: cursor.textRange.start.column,
    };
  }
}

function ignoreLeadingTrivia(cursor: Cursor) {
  while (
    cursor.goToNextTerminal() &&
    cursor.node.isTerminalNode() &&
    TerminalKindExtensions.isTrivia(cursor.node.kind)
  ) {
    // ignore trivia nodes
  }
}
