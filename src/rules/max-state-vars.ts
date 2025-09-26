import {
  Diagnostic,
  RuleContext,
  RuleDefinition,
  RuleWithConfig,
} from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";
import * as z from "zod";

const DEFAULT_MAX_STATE_VARIABLES = 15;

const ConfigSchema = z
  .optional(z.number())
  .default(DEFAULT_MAX_STATE_VARIABLES);
type Config = z.infer<typeof ConfigSchema>;

export const MaxStateVars: RuleDefinition<Config> = {
  name: "max-state-vars",
  recommended: true,
  parseConfig: (config: unknown) => {
    return ConfigSchema.parse(config);
  },
  create: function (config) {
    return new MaxStateVarsRule(this.name, config);
  },
};

class MaxStateVarsRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKind(NonterminalKind.ContractDefinition)
    ) {
      const contractCursor = cursor.spawn();

      if (!contractCursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
        continue;
      }

      const contractName = contractCursor.node.unparse();
      const contractRange = contractCursor.textRange;

      let count = 0;
      while (
        contractCursor.goToNextNonterminalWithKind(
          NonterminalKind.StateVariableDefinition,
        )
      ) {
        count++;
      }

      if (count > this.config) {
        diagnostics.push({
          sourceId: file.id,
          rule: this.name,
          message: `Contract '${contractName}' has more than ${this.config} state variables`,
          line: contractRange.start.line,
          column: contractRange.start.column,
        });
      }
    }

    return diagnostics;
  }
}
