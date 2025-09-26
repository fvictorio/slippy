import { Parameters } from "@nomicfoundation/slang/ast";
import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithConfig,
  RuleWithConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  NonterminalKind,
  Query,
} from "@nomicfoundation/slang/cst";
import * as z from "zod";
import { ignoreLeadingTrivia } from "../slang/trivia.js";

const RETURN_PARAMS_QUERY = Query.create(`
[ReturnsDeclaration
  [ParametersDeclaration
    @params [Parameters]
  ]
]`);

const DEFAULT_MIN_PARAMS = 2;

const ConfigSchema = z
  .strictObject({
    minParams: z.number().default(DEFAULT_MIN_PARAMS),
  })
  .default({ minParams: DEFAULT_MIN_PARAMS });
type Config = z.infer<typeof ConfigSchema>;

export const NamedReturnParams: RuleDefinitionWithConfig<Config> = {
  name: "named-return-params",
  recommended: true,
  parseConfig: (config: unknown) => ConfigSchema.parse(config),
  create: function (config: Config) {
    return new NamedReturnParamsRule(this.name, config);
  },
};

class NamedReturnParamsRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const matches = cursor.query([RETURN_PARAMS_QUERY]);

    for (const match of matches) {
      const paramsCursor = match.captures.params[0];
      assertNonterminalNode(paramsCursor.node, NonterminalKind.Parameters);
      const params = new Parameters(paramsCursor.node);

      if (params.items.length < this.config.minParams) {
        continue;
      }

      const textRangeCursor = match.root.spawn();

      for (const param of params.items) {
        while (textRangeCursor.node.id !== param.cst.id) {
          textRangeCursor.goToNextNonterminalWithKind(
            NonterminalKind.Parameter,
          );
        }
        ignoreLeadingTrivia(textRangeCursor);

        if (param.name === undefined) {
          diagnostics.push({
            rule: this.name,
            sourceId: file.id,
            line: textRangeCursor.textRange.start.line,
            column: textRangeCursor.textRange.start.column,
            message: "Unnamed return parameter",
          });
        }
      }
    }

    return diagnostics;
  }
}
