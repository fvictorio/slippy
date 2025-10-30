import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithConfig,
  RuleWithConfig,
} from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";
import * as z from "zod";
import { ignoreLeadingTrivia } from "../slang/trivia.js";

function isValidQuery(query: string): boolean {
  try {
    Query.create(query);
    return true;
  } catch {
    return false;
  }
}

const ConfigSchema = z
  .array(
    z.strictObject({
      query: z.string().refine(isValidQuery, {
        error: "Invalid Slang query",
      }),
      message: z.string(),
    }),
  )
  .default([]);
type Config = z.infer<typeof ConfigSchema>;

export const NoRestrictedSyntax: RuleDefinitionWithConfig<Config> = {
  name: "no-restricted-syntax",
  recommended: false,
  parseConfig: (config: unknown) => ConfigSchema.parse(config),
  create: function (config: Config) {
    return new NoRestrictedSyntaxRule(this.name, config);
  },
};

class NoRestrictedSyntaxRule implements RuleWithConfig<Config> {
  constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    for (const { query, message } of this.config) {
      const matches = cursor.query([Query.create(query)]);
      for (const match of matches) {
        const textRangeCursor = match.root.spawn();
        ignoreLeadingTrivia(textRangeCursor);
        const textRange = textRangeCursor.textRange;

        diagnostics.push({
          rule: this.name,
          sourceId: file.id,
          line: textRange.start.line,
          column: textRange.start.column,
          message: `Restricted syntax: ${message}`,
        });
      }
    }

    return diagnostics;
  }
}
