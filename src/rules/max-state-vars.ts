import { Rule, LintResult, RuleContext } from "./types.js";
import { NonterminalKind, TerminalKind } from "@nomicfoundation/slang/cst";
import * as z from "zod";

const DEFAULT_MAX_STATE_VARIABLES = 15;

const ConfigSchema = z.optional(z.number());

export class MaxStateVars implements Rule {
  public static ruleName = "max-state-vars";
  public static recommended = true;

  public maxStateVariables: number;

  public constructor(userMaxStateVariables: unknown) {
    const maxStateVariables = ConfigSchema.parse(userMaxStateVariables);

    this.maxStateVariables = maxStateVariables ?? DEFAULT_MAX_STATE_VARIABLES;
  }

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

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

      if (count > this.maxStateVariables) {
        results.push({
          sourceId: file.id,
          rule: MaxStateVars.ruleName,
          message: `Contract '${contractName}' has more than ${this.maxStateVariables} state variables`,
          line: contractRange.start.line,
          column: contractRange.start.column,
        });
      }
    }

    return results;
  }
}
